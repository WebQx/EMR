# 🌐 WebQx Remote EMR Access Setup

## Quick Cloud Deployment (15-30 minutes)

### Option 1: Railway (Recommended)
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
railway init
railway up
```

### Option 2: Render
```bash
# 1. Connect GitHub repo to Render
# 2. Deploy backend: django-auth-backend/
# 3. Deploy frontend: static files
```

### Option 3: Vercel (Frontend + API)
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel --prod
```

## Environment Variables Needed:
```
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-id
MICROSOFT_CLIENT_ID=your-microsoft-id
DATABASE_URL=your-db-url
```

## Expected Timeline:
- **Setup**: 15 minutes
- **DNS propagation**: 5-10 minutes
- **SSL certificate**: 2-5 minutes
- **Total**: 20-30 minutes

## Demo Access (Available Now):
- Frontend: https://webqx.github.io/webqx/
- Login: demo@patient.com / patient123
- Note: Backend features require cloud deployment