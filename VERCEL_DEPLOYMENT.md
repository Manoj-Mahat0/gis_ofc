# Vercel Deployment Guide

## Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Create a Vercel account at https://vercel.com

## Deployment Steps

### 1. Login to Vercel
```bash
vercel login
```

### 2. Deploy from Backend Directory
```bash
cd backend
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **telecaller-backend** (or your preferred name)
- Directory? **./** (current directory)
- Override settings? **N**

### 3. Set Environment Variables
After deployment, add your environment variables:

```bash
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add JWT_EXPIRE
vercel env add NODE_ENV
```

Or add them via Vercel Dashboard:
1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add the following variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret key
   - `JWT_EXPIRE` - Token expiration (e.g., 30d)
   - `NODE_ENV` - production

### 4. Redeploy with Environment Variables
```bash
vercel --prod
```

## Important Notes

### Socket.IO Limitation
⚠️ Vercel's serverless functions don't support WebSocket connections (Socket.IO). 
If you need real-time features, consider:
- Using a separate service for Socket.IO (Railway, Render, Heroku)
- Using Vercel for REST API only
- Implementing polling instead of WebSockets

### MongoDB Connection
- Use MongoDB Atlas for production
- Whitelist Vercel's IP addresses (or use 0.0.0.0/0 for all IPs)
- Connection string format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### API Endpoints
Your API will be available at:
- Production: `https://your-project.vercel.app/api/...`
- Development: `https://your-project-hash.vercel.app/api/...`

### Update Flutter App
Update your Flutter app's API configuration to point to the Vercel URL:
```dart
// lib/config/api_config.dart
static const String baseUrl = 'https://your-project.vercel.app';
```

## Vercel Dashboard
Access your deployment at: https://vercel.com/dashboard

## Troubleshooting

### View Logs
```bash
vercel logs
```

### Check Deployment Status
```bash
vercel ls
```

### Remove Deployment
```bash
vercel remove project-name
```

## Alternative: Deploy via GitHub
1. Push your code to GitHub
2. Import project in Vercel Dashboard
3. Connect your repository
4. Add environment variables
5. Deploy automatically on every push

## Files Created
- `vercel.json` - Vercel configuration
- `.vercelignore` - Files to ignore during deployment
- `api/index.js` - Serverless function entry point (alternative)

## Production Checklist
- [ ] MongoDB Atlas configured with proper IP whitelist
- [ ] All environment variables set in Vercel
- [ ] JWT_SECRET is strong and secure
- [ ] CORS configured for your Flutter app domain
- [ ] Rate limiting configured appropriately
- [ ] Error handling tested
- [ ] API endpoints tested in production
- [ ] Flutter app updated with production URL
