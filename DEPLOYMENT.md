# 🚀 Deployment Guide - Garuda AI

Panduan lengkap untuk deploy Garuda AI ke berbagai platform.

## 📋 Prerequisites

1. **Environment Variables**: Copy `.env.example` ke `.env.local` dan isi semua variabel
2. **Supabase Setup**: Database sudah dikonfigurasi dengan migrasi yang benar
3. **API Keys**: Gemini API key untuk AI features
4. **Payment Gateway**: Konfigurasi Midtrans/Xendit/Stripe (opsional)

## 🌐 Platform Deployment

### 1. Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables di Vercel dashboard
# atau gunakan CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... tambahkan semua env vars
```

**Konfigurasi Vercel:**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Framework: Next.js

### 2. Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build dan deploy
npm run build
netlify deploy --prod --dir=.next
```

**Konfigurasi Netlify:**
- Gunakan file `netlify.toml` yang sudah disediakan
- Set environment variables di Netlify dashboard

### 3. Docker

```bash
# Build image
docker build -t garuda-ai .

# Run container
docker run -p 3000:3000 --env-file .env.local garuda-ai

# Atau gunakan docker-compose
docker-compose up -d
```

### 4. Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login dan deploy
railway login
railway init
railway up
```

### 5. DigitalOcean App Platform

1. Connect GitHub repository
2. Set environment variables
3. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `npm start`

## 🔧 Environment Variables Setup

### Required Variables

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin (Required)
ADMIN_EMAIL=admin@garuda-ai.com
NEXT_PUBLIC_ADMIN_EMAIL=admin@garuda-ai.com

# AI Service (Required)
GEMINI_API_KEY=your-gemini-api-key

# App URL (Required for production)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Optional Variables (Payment)

```bash
# Midtrans
MIDTRANS_SERVER_KEY=your-server-key
MIDTRANS_CLIENT_KEY=your-client-key
MIDTRANS_IS_PRODUCTION=false

# Xendit
XENDIT_SECRET_KEY=your-secret-key
XENDIT_PUBLIC_KEY=your-public-key
XENDIT_WEBHOOK_TOKEN=your-webhook-token

# Stripe
STRIPE_SECRET_KEY=your-secret-key
STRIPE_PUBLISHABLE_KEY=your-publishable-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

## 🗄️ Database Setup

### 1. Supabase Project

1. Create new project di [supabase.com](https://supabase.com)
2. Copy URL dan keys ke environment variables
3. Run migrations:

```sql
-- Jalankan semua file di supabase/migrations/ secara berurutan
-- Atau gunakan Supabase CLI:
supabase db push
```

### 2. Required Tables

- `profiles` - User profiles dan credits
- `saved_prompts` - User saved prompts
- `subscriptions` - Subscription management

## 🔑 API Keys Setup

### 1. Google Gemini API

1. Pergi ke [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add ke environment variables sebagai `GEMINI_API_KEY`

### 2. Payment Gateway (Optional)

**Midtrans:**
1. Daftar di [midtrans.com](https://midtrans.com)
2. Get Server Key dan Client Key dari dashboard
3. Set `MIDTRANS_IS_PRODUCTION=false` untuk testing

**Xendit:**
1. Daftar di [xendit.co](https://xendit.co)
2. Get API keys dari dashboard
3. Setup webhook URL

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase database setup dan migrations applied
- [ ] Gemini API key working
- [ ] Build berhasil (`npm run build`)
- [ ] Health check endpoint working (`/api/health`)
- [ ] Admin access configured
- [ ] Payment gateway tested (jika digunakan)
- [ ] Domain dan SSL configured
- [ ] Error monitoring setup (optional)

## 🔍 Testing Deployment

```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Test API endpoints
curl https://your-domain.com/api/templates

# Test authentication flow
# Login dan test protected routes
```

## 📊 Monitoring

### 1. Error Tracking

Integrate dengan:
- Sentry
- LogRocket
- Bugsnag

### 2. Analytics

Setup:
- Google Analytics
- Vercel Analytics
- Custom analytics

### 3. Performance

Monitor:
- Core Web Vitals
- API response times
- Database query performance

## 🔧 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Check variable names (case sensitive)
   - Restart deployment after adding variables

2. **Supabase Connection Failed**
   - Verify URL dan keys
   - Check database migrations
   - Verify RLS policies

3. **Build Failures**
   - Check TypeScript errors
   - Verify all dependencies installed
   - Check Node.js version compatibility

4. **API Timeouts**
   - Increase function timeout limits
   - Optimize database queries
   - Add proper error handling

### Support

- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)
- Email: support@garuda-ai.com
- Documentation: [docs.garuda-ai.com](https://docs.garuda-ai.com)

## 📈 Scaling

### Performance Optimization

1. **Database**
   - Add indexes untuk queries yang sering
   - Implement connection pooling
   - Use read replicas

2. **Caching**
   - Redis untuk session storage
   - CDN untuk static assets
   - API response caching

3. **Infrastructure**
   - Load balancing
   - Auto-scaling
   - Database sharding

### Security

1. **Environment**
   - Rotate API keys regularly
   - Use secrets management
   - Enable audit logging

2. **Application**
   - Rate limiting
   - Input validation
   - SQL injection protection
   - XSS protection