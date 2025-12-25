# Quick Start Guide - Vercel Deployment

Get your Sentinel app deployed to Vercel in 15 minutes!

## Prerequisites

1. Node.js 18+ installed
2. Git installed
3. Accounts created (free tiers):
   - [Vercel](https://vercel.com)
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - [Cloudinary](https://cloudinary.com)
   - [Pusher](https://pusher.com)

## Step-by-Step Deployment

### 1. Clone & Install (2 min)

```bash
# Navigate to project directory
cd pulsegen-assignment

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Set Up Services (8 min)

#### MongoDB Atlas (2 min)
1. Create cluster → Click "Create Deployment"
2. Choose M0 Free tier
3. Create user: username + password
4. Network Access → Add IP: `0.0.0.0/0`
5. Copy connection string → Replace `<password>`

#### Cloudinary (2 min)
1. Sign up → Verify email
2. Dashboard → Note: Cloud Name, API Key, API Secret

#### Pusher (2 min)
1. Create account → Create Channels app
2. Name it "Sentinel"
3. App Keys tab → Note: App ID, Key, Secret, Cluster

### 3. Deploy to Vercel (5 min)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to project? N
# - Project name: sentinel
# - Directory: . (current)
```

### 4. Add Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these (replace with your actual values):

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sentinel
JWT_SECRET=your_random_32_character_secret_key_here
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
FRONTEND_URL=https://your-app.vercel.app
VITE_PUSHER_KEY=your_key
VITE_PUSHER_CLUSTER=your_cluster
```

⚠️ Make sure to select **Production, Preview, and Development** for each variable!

### 5. Redeploy

```bash
vercel --prod
```

### 6. Test Your App

Visit: `https://your-app.vercel.app`

Test:
1. Register a new account
2. Upload a video
3. Watch real-time processing updates
4. View video in library

## Environment Variables Cheat Sheet

| Variable | Where to Get It | Example |
|----------|----------------|---------|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers | `mongodb+srv://user:pass@cluster.mongodb.net/sentinel` |
| `JWT_SECRET` | Generate random string (32+ chars) | `openssl rand -base64 32` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard | `dxyz123abc` |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard → API Keys | `abcdefghijklmnopqrstuvwxyz` |
| `PUSHER_APP_ID` | Pusher → App Keys | `1234567` |
| `PUSHER_KEY` | Pusher → App Keys | `a1b2c3d4e5f6g7h8i9j0` |
| `PUSHER_SECRET` | Pusher → App Keys | `z9y8x7w6v5u4t3s2r1q0` |
| `PUSHER_CLUSTER` | Pusher → App Keys | `us2` or `eu` or `ap1` |
| `FRONTEND_URL` | Vercel deployment URL | `https://sentinel.vercel.app` |

## Generate JWT Secret

```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Troubleshooting

### "Module not found" errors
```bash
cd backend && npm install
cd ../frontend && npm install
```

### "Database connection failed"
- Check MongoDB Atlas allows `0.0.0.0/0`
- Verify username/password in connection string
- Test connection: `mongosh "your_connection_string"`

### "Pusher not connecting"
- Verify `VITE_PUSHER_KEY` and `VITE_PUSHER_CLUSTER` are set
- Check keys match between backend and frontend
- Open browser console for errors

### "CORS errors"
- Set `FRONTEND_URL` to your Vercel URL
- Redeploy: `vercel --prod`

### "Function timeout"
- Video files > 100MB may timeout
- Use smaller test videos initially
- Consider upgrading to Vercel Pro for 300s timeout

## What's Next?

### Create Test Users

After deployment, create accounts with different roles:

**Option 1: Via UI**
- Register at `/register`
- Manually update role in MongoDB Atlas

**Option 2: Via API**
```bash
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@test.com",
    "password": "admin123",
    "role": "admin",
    "organization": "default"
  }'
```

### Monitor Your App

```bash
# View logs
vercel logs

# View deployments
vercel ls

# Open dashboard
vercel open
```

### Update Your App

```bash
# Make changes
git add .
git commit -m "Update feature"

# Deploy
vercel --prod
```

## Free Tier Limits

Stay within these to avoid charges:

| Service | Free Limit | Monitor At |
|---------|-----------|------------|
| Vercel | 100GB bandwidth/month | [Dashboard](https://vercel.com/dashboard) |
| MongoDB | 512MB storage | [Atlas Dashboard](https://cloud.mongodb.com) |
| Cloudinary | 25GB bandwidth/month | [Console](https://cloudinary.com/console) |
| Pusher | 100 concurrent connections | [Dashboard](https://dashboard.pusher.com) |

## Need Help?

1. Check logs: `vercel logs`
2. Review [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed guide
3. Check [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) for technical details
4. Open an issue on GitHub

---

**🎉 Congratulations!** Your video platform is now live on Vercel!
