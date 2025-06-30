# 🔌 Garuda AI - API Documentation

## Base URL
```
Production: https://garuda-ai.com/api
Development: http://localhost:3000/api
```

## Authentication

Semua endpoint yang memerlukan autentikasi menggunakan Bearer token dari Supabase:

```bash
Authorization: Bearer <supabase_access_token>
```

## Endpoints

### 🏥 Health Check

**GET** `/api/health`

Check status aplikasi.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-28T10:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

### 🖼️ Image Analysis

**POST** `/api/analyze-image`

Analisis gambar untuk generate prompt.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body:**
- `image`: File (JPEG, PNG, WebP, max 10MB)

**Response:**
```json
{
  "generatedPrompt": "Detailed description of the image...",
  "creditsRemaining": 9
}
```

**Errors:**
- `401`: Authentication required
- `402`: Insufficient credits
- `400`: Invalid file type/size
- `500`: AI service error

### ✨ Prompt Enhancement

**POST** `/api/enhance-prompt`

Enhance prompt menggunakan AI.

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "prompt": "Basic prompt text"
}
```

**Response:**
```json
{
  "enhancedPrompt": "Enhanced detailed prompt..."
}
```

### 📝 Prompt Management

#### Get User Prompts

**GET** `/api/prompts`

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `type`: `image` | `text` | `favorites` | `all` (default: `all`)
- `search`: Search term
- `limit`: Number of results (max 100, default 50)

**Response:**
```json
{
  "prompts": [
    {
      "id": "uuid",
      "prompt_text": "Prompt content...",
      "type": "image",
      "is_favorite": false,
      "tags": ["tag1", "tag2"],
      "created_at": "2025-01-28T10:00:00.000Z"
    }
  ]
}
```

#### Save Prompt

**POST** `/api/prompts`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "prompt_text": "Prompt content...",
  "type": "image",
  "tags": ["tag1", "tag2"]
}
```

#### Update Prompt

**PUT** `/api/prompts/{id}`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "is_favorite": true,
  "tags": ["new-tag"]
}
```

#### Delete Prompt

**DELETE** `/api/prompts/{id}`

**Headers:**
- `Authorization: Bearer <token>`

### 📊 Analytics

**GET** `/api/analytics`

Get user usage analytics.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "analytics": {
    "totalPrompts": 25,
    "imagePrompts": 15,
    "textPrompts": 10,
    "favoritePrompts": 5,
    "imageAnalysisUsed": 3,
    "imageAnalysisRemaining": 7,
    "joinDate": "2025-01-01T00:00:00.000Z",
    "lastActivity": "2025-01-28T10:00:00.000Z",
    "weeklyActivity": [2, 3, 1, 4, 2, 1, 0],
    "popularTags": [
      {"tag": "portrait", "count": 5},
      {"tag": "landscape", "count": 3}
    ]
  }
}
```

### 🎨 Templates

**GET** `/api/templates`

Get prompt templates.

**Query Parameters:**
- `category`: `photography` | `art` | `character` | etc.
- `difficulty`: `beginner` | `intermediate` | `advanced`
- `search`: Search term

**Response:**
```json
{
  "templates": [
    {
      "id": "indo-portrait",
      "title": "Portrait Indonesia Tradisional",
      "description": "Template untuk portrait...",
      "category": "photography",
      "prompt": "Template prompt with [VARIABLES]",
      "tags": ["portrait", "traditional"],
      "difficulty": "beginner",
      "variables": [
        {
          "name": "GENDER",
          "options": ["woman", "man", "person"]
        }
      ]
    }
  ]
}
```

**POST** `/api/templates`

Customize template with variables.

**Body:**
```json
{
  "templateId": "indo-portrait",
  "variables": {
    "GENDER": "woman",
    "REGION": "Jawa"
  }
}
```

**Response:**
```json
{
  "customizedPrompt": "Portrait of a woman wearing traditional Jawa clothing...",
  "template": {
    "id": "indo-portrait",
    "title": "Portrait Indonesia Tradisional",
    "category": "photography"
  }
}
```

### 💳 Subscription

#### Get Current Subscription

**GET** `/api/subscription`

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "plan_id": "pro",
    "status": "active",
    "current_period_start": "2025-01-01T00:00:00.000Z",
    "current_period_end": "2025-02-01T00:00:00.000Z",
    "cancel_at_period_end": false
  }
}
```

#### Create Subscription

**POST** `/api/subscription`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "plan_id": "pro"
}
```

### 💰 Payment

#### Create Payment Intent

**POST** `/api/payment/create-intent`

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "planId": "pro"
}
```

**Response:**
```json
{
  "paymentIntent": {
    "id": "payment_id",
    "amount": 49000,
    "currency": "IDR",
    "status": "pending",
    "paymentUrl": "https://payment-gateway.com/pay/xxx"
  },
  "subscription": {
    "id": "subscription_id",
    "status": "pending"
  },
  "provider": "midtrans"
}
```

#### Payment Webhook

**POST** `/api/payment/webhook`

Webhook endpoint untuk payment gateway.

### 🛠️ Admin (Admin Only)

#### Get Statistics

**GET** `/api/admin/stats`

**Headers:**
- `Authorization: Bearer <admin_token>`

#### Get Users

**GET** `/api/admin/users`

**Query Parameters:**
- `page`: Page number
- `limit`: Results per page
- `search`: Search by email

#### Update User Credits

**PUT** `/api/admin/users`

**Body:**
```json
{
  "userId": "uuid",
  "credits": 100
}
```

#### Debug Info

**GET** `/api/admin/debug`

Get debug information for troubleshooting.

**POST** `/api/admin/debug`

Sync missing user profiles.

## Rate Limits

- General API: 30 requests/minute
- Image Analysis: 5 requests/minute
- Admin endpoints: 100 requests/minute

## Error Codes

- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Authentication required
- `402`: Payment Required - Insufficient credits
- `403`: Forbidden - Access denied
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error
- `503`: Service Unavailable - External service error

## Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details if available"
}
```

## SDKs & Examples

### JavaScript/TypeScript

```javascript
// Initialize client
const client = new GarudaAIClient({
  baseUrl: 'https://garuda-ai.com/api',
  token: 'your-supabase-token'
});

// Analyze image
const result = await client.analyzeImage(file);

// Get prompts
const prompts = await client.getPrompts({ type: 'image' });

// Save prompt
await client.savePrompt({
  prompt_text: 'Amazing prompt...',
  type: 'image',
  tags: ['portrait']
});
```

### cURL Examples

```bash
# Health check
curl https://garuda-ai.com/api/health

# Analyze image
curl -X POST https://garuda-ai.com/api/analyze-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@image.jpg"

# Get prompts
curl https://garuda-ai.com/api/prompts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Save prompt
curl -X POST https://garuda-ai.com/api/prompts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt_text":"Test prompt","type":"image"}'
```

## Support

- Email: api-support@garuda-ai.com
- Documentation: https://docs.garuda-ai.com
- Status Page: https://status.garuda-ai.com