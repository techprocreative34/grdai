import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppError, handleApiError, logError } from '@/utils/errorHandler';

type PromptType = 'image' | 'text';

interface PromptTypeData {
  type: PromptType;
}

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
      logError(authError, 'User authentication failed in admin stats API');
      throw new AppError('Invalid authentication token', 401);
    }

    // Check if user is admin
    if (user.email !== process.env.ADMIN_EMAIL) {
      logError({ userId: user.id, email: user.email }, 'Unauthorized admin access attempt');
      throw new AppError('Access denied. Admin privileges required.', 403);
    }

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      logError(usersError, 'Failed to count total users');
      throw new AppError('Failed to fetch user statistics', 500);
    }

    // Get total prompts count
    const { count: totalPrompts, error: promptsError } = await supabaseAdmin
      .from('saved_prompts')
      .select('*', { count: 'exact', head: true });

    if (promptsError) {
      logError(promptsError, 'Failed to count total prompts');
      throw new AppError('Failed to fetch prompt statistics', 500);
    }

    // Get prompts by type
    const { data: promptsByType, error: promptsTypeError } = await supabaseAdmin
      .from('saved_prompts')
      .select('type')
      .then(result => {
        if (result.error) return result;
        
        const counts: Record<PromptType, number> = { image: 0, text: 0 };
        (result.data as PromptTypeData[])?.forEach(prompt => {
          if (prompt.type === 'image' || prompt.type === 'text') {
            counts[prompt.type]++;
          }
        });
        
        return { data: counts, error: null };
      });

    if (promptsTypeError) {
      logError(promptsTypeError, 'Failed to count prompts by type');
      throw new AppError('Failed to fetch prompt type statistics', 500);
    }

    // Get active subscriptions count
    const { count: activeSubscriptions, error: subscriptionsError } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .neq('plan_id', 'free');

    if (subscriptionsError) {
      logError(subscriptionsError, 'Failed to count active subscriptions');
      throw new AppError('Failed to fetch subscription statistics', 500);
    }

    // Get users registered in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: newUsers, error: newUsersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (newUsersError) {
      logError(newUsersError, 'Failed to count new users');
      throw new AppError('Failed to fetch new user statistics', 500);
    }

    // Get daily user registrations for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: dailyRegistrations, error: dailyError } = await supabaseAdmin
      .from('profiles')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (dailyError) {
      logError(dailyError, 'Failed to fetch daily registrations');
      throw new AppError('Failed to fetch daily registration statistics', 500);
    }

    // Process daily registrations
    const dailyStats = Array(7).fill(0);
    const today = new Date();
    
    dailyRegistrations?.forEach(registration => {
      const regDate = new Date(registration.created_at);
      const daysDiff = Math.floor((today.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        dailyStats[6 - daysDiff]++;
      }
    });

    // Get subscription distribution
    const { data: subscriptionStats, error: subStatsError } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_id')
      .eq('status', 'active');

    if (subStatsError) {
      logError(subStatsError, 'Failed to fetch subscription distribution');
      throw new AppError('Failed to fetch subscription distribution', 500);
    }

    const subscriptionDistribution = { free: 0, pro: 0, enterprise: 0 };
    subscriptionStats?.forEach(sub => {
      subscriptionDistribution[sub.plan_id as keyof typeof subscriptionDistribution]++;
    });

    const stats = {
      totalUsers: totalUsers || 0,
      totalPrompts: totalPrompts || 0,
      imagePrompts: promptsByType?.image || 0,
      textPrompts: promptsByType?.text || 0,
      activeSubscriptions: activeSubscriptions || 0,
      newUsersLast30Days: newUsers || 0,
      dailyRegistrations: dailyStats,
      subscriptionDistribution,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({ stats });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}