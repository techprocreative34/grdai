// src/config/payment.ts
export interface PaymentProvider {
  name: string;
  enabled: boolean;
  config: {
    [key: string]: string;
  };
}

export interface PaymentConfig {
  providers: {
    midtrans: PaymentProvider;
    xendit: PaymentProvider;
    stripe: PaymentProvider;
  };
  defaultProvider: 'midtrans' | 'xendit' | 'stripe';
  currency: string;
  plans: {
    [key: string]: {
      name: string;
      price: number;
      features: string[];
      stripePriceId?: string;
      midtransItemId?: string;
      xenditPlanId?: string;
    };
  };
}

// Konfigurasi payment gateway - mudah untuk diubah
export const paymentConfig: PaymentConfig = {
  // Provider yang akan digunakan (pilih salah satu)
  defaultProvider: 'midtrans', // Ganti ke 'xendit' atau 'stripe' sesuai kebutuhan
  
  currency: 'IDR',
  
  providers: {
    midtrans: {
      name: 'Midtrans',
      enabled: true, // Set false untuk menonaktifkan
      config: {
        serverKey: process.env.MIDTRANS_SERVER_KEY || '',
        clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
        isProduction: process.env.MIDTRANS_IS_PRODUCTION || 'false',
        apiUrl: process.env.MIDTRANS_IS_PRODUCTION === 'true' 
          ? 'https://api.midtrans.com/v2' 
          : 'https://api.sandbox.midtrans.com/v2'
      }
    },
    
    xendit: {
      name: 'Xendit',
      enabled: false, // Set true untuk mengaktifkan
      config: {
        secretKey: process.env.XENDIT_SECRET_KEY || '',
        publicKey: process.env.XENDIT_PUBLIC_KEY || '',
        webhookToken: process.env.XENDIT_WEBHOOK_TOKEN || '',
        apiUrl: 'https://api.xendit.co'
      }
    },
    
    stripe: {
      name: 'Stripe',
      enabled: false, // Set true untuk mengaktifkan
      config: {
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        apiUrl: 'https://api.stripe.com'
      }
    }
  },
  
  plans: {
    pro: {
      name: 'Pro Plan',
      price: 49000,
      features: [
        'Analisa gambar unlimited',
        'Simpan prompt unlimited',
        'AI Enhancement premium',
        'Export ke berbagai format',
        'Prioritas dukungan'
      ],
      // ID untuk masing-masing provider (isi sesuai yang didapat dari dashboard)
      stripePriceId: 'price_1234567890', // Dari Stripe Dashboard
      midtransItemId: 'garuda-ai-pro-monthly', // Custom ID untuk Midtrans
      xenditPlanId: 'plan_1234567890' // Dari Xendit Dashboard
    },
    
    enterprise: {
      name: 'Enterprise Plan',
      price: 199000,
      features: [
        'Semua fitur Pro',
        'API access dengan rate limit tinggi',
        'Custom branding',
        'Dedicated account manager',
        'SLA 99.9% uptime'
      ],
      stripePriceId: 'price_0987654321',
      midtransItemId: 'garuda-ai-enterprise-monthly',
      xenditPlanId: 'plan_0987654321'
    }
  }
};

// Helper function untuk mendapatkan provider yang aktif
export const getActiveProvider = (): PaymentProvider => {
  const provider = paymentConfig.providers[paymentConfig.defaultProvider];
  if (!provider.enabled) {
    throw new Error(`Payment provider ${paymentConfig.defaultProvider} is not enabled`);
  }
  return provider;
};

// Helper function untuk validasi konfigurasi
export const validatePaymentConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const activeProvider = paymentConfig.providers[paymentConfig.defaultProvider];
  
  if (!activeProvider.enabled) {
    errors.push(`Default provider ${paymentConfig.defaultProvider} is not enabled`);
  }
  
  // Validasi konfigurasi Midtrans
  if (paymentConfig.defaultProvider === 'midtrans' && activeProvider.enabled) {
    if (!activeProvider.config.serverKey) {
      errors.push('Midtrans Server Key is required');
    }
    if (!activeProvider.config.clientKey) {
      errors.push('Midtrans Client Key is required');
    }
  }
  
  // Validasi konfigurasi Xendit
  if (paymentConfig.defaultProvider === 'xendit' && activeProvider.enabled) {
    if (!activeProvider.config.secretKey) {
      errors.push('Xendit Secret Key is required');
    }
  }
  
  // Validasi konfigurasi Stripe
  if (paymentConfig.defaultProvider === 'stripe' && activeProvider.enabled) {
    if (!activeProvider.config.secretKey) {
      errors.push('Stripe Secret Key is required');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};