import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppError, handleApiError, logError } from '@/utils/errorHandler';

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new AppError('Database configuration error', 500);
    }

    if (!process.env.ADMIN_EMAIL) {
      throw new AppError('Admin configuration error', 500);
    }

    // Initialize Supabase clients
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logError(authError, 'User authentication failed in admin debug API');
      throw new AppError('Invalid authentication token', 401);
    }

    // Check if user is admin
    if (user.email !== process.env.ADMIN_EMAIL) {
      logError({ userId: user.id, email: user.email }, 'Unauthorized admin debug access attempt');
      throw new AppError('Access denied. Admin privileges required.', 403);
    }

    // Debug: Check auth.users table
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      logError(authUsersError, 'Failed to fetch auth users');
    }

    // Debug: Check profiles table
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (profilesError) {
      logError(profilesError, 'Failed to fetch profiles');
    }

    // Debug: Check if profiles exist for all auth users
    const authUserIds = authUsers?.users?.map(u => u.id) || [];
    const profileUserIds = profiles?.map(p => p.id) || [];
    
    const missingProfiles = authUserIds.filter(id => !profileUserIds.includes(id));
    const orphanedProfiles = profileUserIds.filter(id => !authUserIds.includes(id));

    const debugInfo = {
      authUsersCount: authUsers?.users?.length || 0,
      profilesCount: profiles?.length || 0,
      authUsers: authUsers?.users?.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at
      })) || [],
      profiles: profiles?.map(p => ({
        id: p.id,
        email: p.email,
        created_at: p.created_at
      })) || [],
      missingProfiles,
      orphanedProfiles,
      adminEmail: process.env.ADMIN_EMAIL
    };

    return NextResponse.json({ debug: debugInfo });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

// POST endpoint to sync missing profiles
export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new AppError('Database configuration error', 500);
    }

    if (!process.env.ADMIN_EMAIL) {
      throw new AppError('Admin configuration error', 500);
    }

    // Initialize Supabase clients
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logError(authError, 'User authentication failed in admin debug sync');
      throw new AppError('Invalid authentication token', 401);
    }

    // Check if user is admin
    if (user.email !== process.env.ADMIN_EMAIL) {
      logError({ userId: user.id, email: user.email }, 'Unauthorized admin debug sync attempt');
      throw new AppError('Access denied. Admin privileges required.', 403);
    }

    // Get all auth users
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      throw new AppError('Failed to fetch auth users', 500);
    }

    // Get existing profiles
    const { data: existingProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id');

    if (profilesError) {
      throw new AppError('Failed to fetch existing profiles', 500);
    }

    const existingProfileIds = existingProfiles?.map(p => p.id) || [];
    
    // Find users without profiles
    const usersWithoutProfiles = authUsers?.users?.filter(u => 
      !existingProfileIds.includes(u.id)
    ) || [];

    // Create missing profiles
    const profilesToCreate = usersWithoutProfiles.map(u => ({
      id: u.id,
      email: u.email || '',
      image_analysis_credits: 10,
      plan_type: 'free'
    }));

    let createdCount = 0;
    if (profilesToCreate.length > 0) {
      const { data: createdProfiles, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert(profilesToCreate)
        .select();

      if (createError) {
        logError(createError, 'Failed to create missing profiles');
        throw new AppError('Failed to create missing profiles', 500);
      }

      createdCount = createdProfiles?.length || 0;
    }

    // Also create default subscriptions for new profiles
    if (createdCount > 0) {
      const subscriptionsToCreate = profilesToCreate.map(p => ({
        user_id: p.id,
        plan_id: 'free',
        status: 'active'
      }));

      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .insert(subscriptionsToCreate);

      if (subError) {
        logError(subError, 'Failed to create default subscriptions');
        // Don't throw error here, profiles are more important
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully synced ${createdCount} missing profiles`,
      createdCount,
      totalAuthUsers: authUsers?.users?.length || 0
    });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}