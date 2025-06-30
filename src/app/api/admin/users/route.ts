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
      logError(authError, 'User authentication failed in admin users API');
      throw new AppError('Invalid authentication token', 401);
    }

    // Check if user is admin
    if (user.email !== process.env.ADMIN_EMAIL) {
      logError({ userId: user.id, email: user.email }, 'Unauthorized admin access attempt');
      throw new AppError('Access denied. Admin privileges required.', 403);
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    // Build query for users with profiles
    let query = supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        image_analysis_credits,
        plan_type,
        created_at,
        updated_at,
        subscriptions!current_subscription_id (
          plan_id,
          status,
          current_period_end
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter if provided
    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      logError(usersError, 'Failed to fetch users for admin');
      throw new AppError('Failed to fetch users', 500);
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.ilike('email', `%${search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      logError(countError, 'Failed to count users for admin');
      throw new AppError('Failed to count users', 500);
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      users: users || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers: count || 0,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, credits } = await request.json();

    if (!userId || typeof credits !== 'number') {
      throw new AppError('User ID and credits are required', 400);
    }

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
      logError(authError, 'User authentication failed in admin users PUT');
      throw new AppError('Invalid authentication token', 401);
    }

    // Check if user is admin
    if (user.email !== process.env.ADMIN_EMAIL) {
      logError({ userId: user.id, email: user.email }, 'Unauthorized admin access attempt');
      throw new AppError('Access denied. Admin privileges required.', 403);
    }

    // Update user credits
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ image_analysis_credits: credits })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      logError(updateError, 'Failed to update user credits');
      throw new AppError('Failed to update user credits', 500);
    }

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile 
    });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}