# 🚀 Setup Payment Gateway - Garuda AI

Panduan lengkap untuk mengkonfigurasi payment gateway di Garuda AI.

## 📋 Daftar Isi
- [Pilihan Payment Gateway](#pilihan-payment-gateway)
- [Setup Midtrans (Recommended)](#setup-midtrans)
- [Setup Xendit (Alternative)](#setup-xendit)
- [Setup Stripe (International)](#setup-stripe)
- [Konfigurasi Aplikasi](#konfigurasi-aplikasi)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🏦 Pilihan Payment Gateway

### 1. **Midtrans** (Recommended untuk Indonesia)
- ✅ Support semua bank Indonesia
- ✅ E-wallet (GoPay, OVO, DANA, LinkAja)
- ✅ Virtual Account
- ✅ Kartu Kredit/Debit
- ✅ QRIS
- ✅ Fee kompetitif (2.9% + Rp 2.000)

### 2. **Xendit** (Alternative)
- ✅ Support bank Indonesia
- ✅ E-wallet populer
- ✅ Virtual Account
- ✅ API yang mudah
- ✅ Fee mulai dari 2.9%

### 3. **Stripe** (International)
- ✅ Global payment methods
- ✅ Kartu kredit internasional
- ✅ Dokumentasi lengkap
- ❌ Terbatas untuk Indonesia

## 🔧 Setup Midtrans

### 1. Daftar Akun Midtrans
1. Kunjungi [https://midtrans.com](https://midtrans.com)
2. Daftar akun merchant
3. Verifikasi dokumen bisnis
4. Dapatkan akses ke dashboard

### 2. Dapatkan API Keys
1. Login ke [Midtrans Dashboard](https://dashboard.midtrans.com)
2. Pilih environment (Sandbox untuk testing)
3. Pergi ke **Settings > Access Keys**
4. Copy **Server Key** dan **Client Key**

### 3. Konfigurasi Environment
```bash
# .env.local
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
```

### 4. Setup Webhook
1. Di dashboard Midtrans, pergi ke **Settings > Configuration**
2. Set **Payment Notification URL**: `https://yourdomain.com/api/payment/webhook`
3. Set **Finish Redirect URL**: `https://yourdomain.com/payment/success`
4. Set **Unfinish Redirect URL**: `https://yourdomain.com/payment/failed`
5. Set **Error Redirect URL**: `https://yourdomain.com/payment/failed`

## 🔧 Setup Xendit

### 1. Daftar Akun Xendit
1. Kunjungi [https://xendit.co](https://xendit.co)
2. Daftar akun bisnis
3. Verifikasi dokumen
4. Aktivasi akun

### 2. Dapatkan API Keys
1. Login ke [Xendit Dashboard](https://dashboard.xendit.co)
2. Pergi ke **Settings > API Keys**
3. Generate **Secret Key** dan **Public Key**
4. Generate **Webhook Token**

### 3. Konfigurasi Environment
```bash
# .env.local
XENDIT_SECRET_KEY=xnd_development_xxxxxxxxxxxxxxxx
XENDIT_PUBLIC_KEY=xnd_public_development_xxxxxxxxxxxxxxxx
XENDIT_WEBHOOK_TOKEN=your_webhook_token
```

### 4. Setup Webhook
1. Di dashboard Xendit, pergi ke **Settings > Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/payment/webhook`
3. Select events: `invoice.paid`, `invoice.expired`

## 🔧 Setup Stripe

### 1. Daftar Akun Stripe
1. Kunjungi [https://stripe.com](https://stripe.com)
2. Daftar akun
3. Verifikasi bisnis

### 2. Dapatkan API Keys
1. Login ke [Stripe Dashboard](https://dashboard.stripe.com)
2. Pergi ke **Developers > API Keys**
3. Copy **Publishable Key** dan **Secret Key**
4. Setup webhook endpoint

### 3. Konfigurasi Environment
```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
```

## ⚙️ Konfigurasi Aplikasi

### 1. Pilih Provider Default
Edit file `src/config/payment.ts`:

```typescript
export const paymentConfig: PaymentConfig = {
  // Ganti sesuai provider yang ingin digunakan
  defaultProvider: 'midtrans', // 'midtrans' | 'xendit' | 'stripe'
  
  providers: {
    midtrans: {
      enabled: true, // Set true untuk mengaktifkan
      // ...
    },
    xendit: {
      enabled: false, // Set true jika ingin menggunakan Xendit
      // ...
    },
    stripe: {
      enabled: false, // Set true jika ingin menggunakan Stripe
      // ...
    }
  }
}
```

### 2. Update Environment Variables
Copy `.env.example` ke `.env.local` dan isi sesuai provider yang dipilih.

### 3. Test Konfigurasi
Jalankan aplikasi dan cek console untuk validasi konfigurasi:

```bash
npm run dev
```

## 🧪 Testing

### Testing Midtrans
Gunakan test cards dari [Midtrans Documentation](https://docs.midtrans.com/en/technical-reference/sandbox-test):

- **Success**: 4811 1111 1111 1114
- **Failed**: 4911 1111 1111 1113
- **CVV**: 123
- **Expiry**: 12/25

### Testing Xendit
Gunakan test data dari [Xendit Documentation](https://developers.xendit.co/api-reference/#test-scenarios).

### Testing Stripe
Gunakan test cards dari [Stripe Documentation](https://stripe.com/docs/testing):

- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002

## 🔍 Troubleshooting

### Error: "Payment configuration error"
- Pastikan environment variables sudah diset dengan benar
- Cek apakah provider yang dipilih sudah enabled
- Validasi API keys

### Error: "Invalid webhook signature"
- Pastikan webhook URL sudah benar
- Cek webhook token/secret
- Pastikan endpoint dapat diakses dari internet

### Error: "Payment creation failed"
- Cek API keys
- Pastikan akun merchant sudah aktif
- Cek network connectivity

### Webhook tidak diterima
- Pastikan URL webhook dapat diakses public
- Gunakan tools seperti ngrok untuk testing local
- Cek logs di dashboard provider

## 📞 Support

Jika mengalami masalah:

1. **Midtrans**: [support@midtrans.com](mailto:support@midtrans.com)
2. **Xendit**: [support@xendit.co](mailto:support@xendit.co)
3. **Stripe**: [support@stripe.com](mailto:support@stripe.com)
4. **Garuda AI**: [support@garuda-ai.com](mailto:support@garuda-ai.com)

## 📚 Dokumentasi Lengkap

- [Midtrans Docs](https://docs.midtrans.com)
- [Xendit Docs](https://developers.xendit.co)
- [Stripe Docs](https://stripe.com/docs)