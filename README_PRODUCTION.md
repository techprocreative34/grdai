# 🚀 Garuda AI - Production Setup

## Quick Start

1. **Clone & Install**
```bash
git clone <repository-url>
cd garuda-ai
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env.local
# Edit .env.local dengan konfigurasi Anda
```

3. **Database Setup**
- Create Supabase project
- Run migrations dari folder `supabase/migrations/`
- Update environment variables

4. **Deploy**
```bash
# Vercel
vercel

# Atau Netlify
netlify deploy --prod

# Atau Docker
docker-compose up -d
```

## 🔧 Configuration

### Required Services

1. **Supabase** - Database & Authentication
2. **Google Gemini** - AI Image Analysis
3. **Payment Gateway** - Midtrans/Xendit/Stripe (optional)

### Environment Variables

Copy semua variables dari `.env.example` dan isi dengan nilai yang sesuai.

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Panduan lengkap deployment
- [Payment Setup](./README_PAYMENT_SETUP.md) - Setup payment gateway
- [API Documentation](./docs/api.md) - API endpoints

## 🛠️ Development

```bash
# Development server
npm run dev

# Build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🔒 Security

- Environment variables tidak di-commit
- API keys di-encrypt
- Rate limiting enabled
- CORS configured
- SQL injection protection

## 📊 Features

- ✅ AI Prompt Generator untuk gambar dan teks
- ✅ Image-to-Prompt analysis dengan Gemini
- ✅ User authentication dengan Supabase
- ✅ Prompt collection management
- ✅ Subscription system (Pro plans)
- ✅ Admin dashboard
- ✅ Payment integration ready
- ✅ Mobile responsive
- ✅ SEO optimized

## 🌟 Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Google Gemini API
- **Payment**: Midtrans/Xendit/Stripe
- **Deployment**: Vercel/Netlify/Docker

## 📞 Support

- Email: support@garuda-ai.com
- Documentation: [docs.garuda-ai.com](https://docs.garuda-ai.com)
- Issues: GitHub Issues