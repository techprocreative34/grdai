// src/utils/paymentProviders.ts
import { paymentConfig, getActiveProvider } from '@/config/payment';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentUrl?: string;
  metadata: {
    userId: string;
    planId: string;
    subscriptionId: string;
  };
}

export interface PaymentProvider {
  createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata: {
      userId: string;
      planId: string;
      subscriptionId: string;
    };
    customerEmail: string;
    customerName: string;
  }): Promise<PaymentIntent>;
  
  verifyPayment(paymentId: string): Promise<{
    isValid: boolean;
    status: string;
    metadata?: any;
  }>;
}

// Midtrans Provider Implementation
class MidtransProvider implements PaymentProvider {
  private config = paymentConfig.providers.midtrans.config;
  
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata: { userId: string; planId: string; subscriptionId: string };
    customerEmail: string;
    customerName: string;
  }): Promise<PaymentIntent> {
    const orderId = `garuda-ai-${params.metadata.subscriptionId}-${Date.now()}`;
    
    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: params.amount
      },
      credit_card: {
        secure: true
      },
      customer_details: {
        email: params.customerEmail,
        first_name: params.customerName
      },
      item_details: [{
        id: paymentConfig.plans[params.metadata.planId].midtransItemId,
        price: params.amount,
        quantity: 1,
        name: paymentConfig.plans[params.metadata.planId].name
      }],
      custom_field1: params.metadata.userId,
      custom_field2: params.metadata.planId,
      custom_field3: params.metadata.subscriptionId
    };

    const response = await fetch(`${this.config.apiUrl}/charge`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(this.config.serverKey + ':').toString('base64')}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Midtrans error: ${error.error_messages?.[0] || 'Payment creation failed'}`);
    }

    const result = await response.json();
    
    return {
      id: result.transaction_id,
      amount: params.amount,
      currency: params.currency,
      status: result.transaction_status,
      paymentUrl: result.redirect_url,
      metadata: params.metadata
    };
  }

  async verifyPayment(paymentId: string): Promise<{
    isValid: boolean;
    status: string;
    metadata?: any;
  }> {
    const response = await fetch(`${this.config.apiUrl}/${paymentId}/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(this.config.serverKey + ':').toString('base64')}`
      }
    });

    if (!response.ok) {
      return { isValid: false, status: 'error' };
    }

    const result = await response.json();
    
    return {
      isValid: ['capture', 'settlement'].includes(result.transaction_status),
      status: result.transaction_status,
      metadata: {
        userId: result.custom_field1,
        planId: result.custom_field2,
        subscriptionId: result.custom_field3
      }
    };
  }
}

// Xendit Provider Implementation
class XenditProvider implements PaymentProvider {
  private config = paymentConfig.providers.xendit.config;
  
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata: { userId: string; planId: string; subscriptionId: string };
    customerEmail: string;
    customerName: string;
  }): Promise<PaymentIntent> {
    const payload = {
      external_id: `garuda-ai-${params.metadata.subscriptionId}-${Date.now()}`,
      amount: params.amount,
      currency: params.currency,
      payer_email: params.customerEmail,
      description: `${paymentConfig.plans[params.metadata.planId].name} - Garuda AI`,
      success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed`,
      metadata: params.metadata
    };

    const response = await fetch(`${this.config.apiUrl}/v2/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(this.config.secretKey + ':').toString('base64')}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Xendit error: ${error.message || 'Payment creation failed'}`);
    }

    const result = await response.json();
    
    return {
      id: result.id,
      amount: params.amount,
      currency: params.currency,
      status: result.status,
      paymentUrl: result.invoice_url,
      metadata: params.metadata
    };
  }

  async verifyPayment(paymentId: string): Promise<{
    isValid: boolean;
    status: string;
    metadata?: any;
  }> {
    const response = await fetch(`${this.config.apiUrl}/v2/invoices/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(this.config.secretKey + ':').toString('base64')}`
      }
    });

    if (!response.ok) {
      return { isValid: false, status: 'error' };
    }

    const result = await response.json();
    
    return {
      isValid: result.status === 'PAID',
      status: result.status,
      metadata: result.metadata
    };
  }
}

// Stripe Provider Implementation (untuk kelengkapan)
class StripeProvider implements PaymentProvider {
  private config = paymentConfig.providers.stripe.config;
  
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata: { userId: string; planId: string; subscriptionId: string };
    customerEmail: string;
    customerName: string;
  }): Promise<PaymentIntent> {
    // Implementasi Stripe (jika diperlukan)
    throw new Error('Stripe implementation not yet available');
  }

  async verifyPayment(paymentId: string): Promise<{
    isValid: boolean;
    status: string;
    metadata?: any;
  }> {
    // Implementasi Stripe (jika diperlukan)
    throw new Error('Stripe implementation not yet available');
  }
}

// Factory function untuk mendapatkan provider yang aktif
export const getPaymentProvider = (): PaymentProvider => {
  const activeProvider = getActiveProvider();
  
  switch (paymentConfig.defaultProvider) {
    case 'midtrans':
      return new MidtransProvider();
    case 'xendit':
      return new XenditProvider();
    case 'stripe':
      return new StripeProvider();
    default:
      throw new Error(`Unsupported payment provider: ${paymentConfig.defaultProvider}`);
  }
};