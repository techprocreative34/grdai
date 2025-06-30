import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppError, handleApiError, logError } from '@/utils/errorHandler';
import { getPaymentProvider } from '@/utils/paymentProviders';
import { paymentConfig, validatePaymentConfig } from '@/config/payment';

export async function POST(request: Request) {
  try {
    // Validasi konfigurasi payment
    const configValidation = validatePaymentConfig();
    if (!configValidation.isValid) {
      throw new AppError(`Payment configuration error: ${configValidation.errors.join(', ')}`, 500);
    }

    const { planId } = await request.json();

    if (!planId || !paymentConfig.plans[planId]) {
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
      logError(authError, 'User authentication failed in payment intent creation');
      throw new AppError('Invalid authentication token', 401);
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logError(profileError, 'Failed to fetch user profile');
      throw new AppError('Failed to fetch user profile', 500);
    }

    // Cancel any existing pending subscriptions
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('user_id', user.id)
      .eq('status', 'pending');

    // Create new subscription record
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'pending',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (subError) {
      logError(subError, 'Failed to create subscription');
      throw new AppError('Failed to create subscription', 500);
    }

    // Create payment intent using active provider
    const paymentProvider = getPaymentProvider();
    const plan = paymentConfig.plans[planId];
    
    const paymentIntent = await paymentProvider.createPaymentIntent({
      amount: plan.price,
      currency: paymentConfig.currency,
      metadata: {
        userId: user.id,
        planId,
        subscriptionId: subscription.id
      },
      customerEmail: user.email || '',
      customerName: profile.email?.split('@')[0] || 'User'
    });

    // Update subscription with payment intent ID
    await supabase
      .from('subscriptions')
      .update({ 
        stripe_subscription_id: paymentIntent.id // Reuse this field for all providers
      })
      .eq('id', subscription.id);

    return NextResponse.json({
      paymentIntent,
      subscription,
      provider: paymentConfig.defaultProvider
    });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}