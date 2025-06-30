import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppError, handleApiError, logError } from '@/utils/errorHandler';
import { getPaymentProvider } from '@/utils/paymentProviders';
import { paymentConfig } from '@/config/payment';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature') || request.headers.get('stripe-signature') || '';
    
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new AppError('Database configuration error', 500);
    }

    // Initialize Supabase with service role for webhook
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let webhookData;
    
    // Parse webhook data based on provider
    if (paymentConfig.defaultProvider === 'midtrans') {
      // Midtrans webhook validation
      const crypto = require('crypto');
      const serverKey = paymentConfig.providers.midtrans.config.serverKey;
      
      webhookData = JSON.parse(body);
      const orderId = webhookData.order_id;
      const statusCode = webhookData.status_code;
      const grossAmount = webhookData.gross_amount;
      
      const signatureKey = crypto
        .createHash('sha512')
        .update(orderId + statusCode + grossAmount + serverKey)
        .digest('hex');
      
      if (signatureKey !== webhookData.signature_key) {
        throw new AppError('Invalid webhook signature', 400);
      }
      
    } else if (paymentConfig.defaultProvider === 'xendit') {
      // Xendit webhook validation
      const webhookToken = paymentConfig.providers.xendit.config.webhookToken;
      
      if (signature !== webhookToken) {
        throw new AppError('Invalid webhook signature', 400);
      }
      
      webhookData = JSON.parse(body);
      
    } else {
      throw new AppError('Unsupported payment provider for webhook', 400);
    }

    // Process payment based on status
    const paymentProvider = getPaymentProvider();
    let paymentId: string;
    
    if (paymentConfig.defaultProvider === 'midtrans') {
      paymentId = webhookData.transaction_id;
    } else if (paymentConfig.defaultProvider === 'xendit') {
      paymentId = webhookData.id;
    } else {
      throw new AppError('Unable to extract payment ID', 400);
    }

    // Verify payment with provider
    const verification = await paymentProvider.verifyPayment(paymentId);
    
    if (verification.isValid && verification.metadata) {
      // Payment successful - activate subscription
      const { subscriptionId, userId, planId } = verification.metadata;
      
      // Update subscription status
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', subscriptionId);

      if (updateError) {
        logError(updateError, 'Failed to update subscription status');
        throw new AppError('Failed to update subscription', 500);
      }

      // Update user profile
      await supabase
        .from('profiles')
        .update({
          current_subscription_id: subscriptionId,
          plan_type: planId,
          // Reset credits for pro users
          image_analysis_credits: planId === 'pro' ? 999999 : 10
        })
        .eq('id', userId);

      console.log(`Payment successful for user ${userId}, plan ${planId}`);
      
      // TODO: Send confirmation email
      
    } else {
      // Payment failed or pending
      console.log(`Payment verification failed for payment ${paymentId}:`, verification);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    logError(error, 'Payment webhook error');
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}