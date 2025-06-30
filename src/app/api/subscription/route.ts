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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new AppError('Database configuration error', 500);
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logError(authError, 'User authentication failed in subscription GET');
      throw new AppError('Invalid authentication token', 401);
    }

    // Get user's current subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      logError(subError, 'Failed to fetch subscription');
      throw new AppError('Failed to fetch subscription', 500);
    }

    // If no active subscription found, return free plan
    const currentSubscription = subscription || {
      id: null,
      plan_id: 'free',
      status: 'active',
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false
    };

    return NextResponse.json({ subscription: currentSubscription });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function POST(request: Request) {
  try {
    const { plan_id } = await request.json();

    if (!plan_id || !['pro', 'enterprise'].includes(plan_id)) {
      throw new AppError('Valid plan ID is required', 400);
    }

    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new AppError('Database configuration error', 500);
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logError(authError, 'User authentication failed in subscription POST');
      throw new AppError('Invalid authentication token', 401);
    }

    // TODO: Integrate with payment gateway (Stripe/Midtrans)
    // For now, we'll create a pending subscription
    
    // Cancel any existing active subscriptions
    await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        cancel_at_period_end: true
      })
      .eq('user_id', user.id)
      .eq('status', 'active');

    // Create new subscription
    const { data: newSubscription, error: createError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id,
        status: 'pending', // Will be activated after payment
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })
      .select()
      .single();

    if (createError) {
      logError(createError, 'Failed to create subscription');
      throw new AppError('Failed to create subscription', 500);
    }

    return NextResponse.json({ 
      subscription: newSubscription,
      message: 'Subscription created. Please complete payment to activate.'
    });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}