# Vercel Deployment Guide

## ✅ Prerequisites Complete
- MongoDB Atlas ✅
- Pusher ✅
- GitHub Repository ✅

## 🚀 Deploy to Vercel

### Step 1: Install Vercel CLI (if not installed)
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
cd pulsegen-assignment
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Select your account
- **Link to existing project?** No
- **Project name?** sentinel (or your choice)
- **Directory?** . (current directory)

### Step 4: Configure Environment Variables

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Add the following variables for **Production, Preview, and Development**:

#### Backend Variables:
```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_32_character_secret_key
JWT_EXPIRE=7d
PUSHER_APP_ID=2095203
PUSHER_KEY=b19873f36faedd774331
PUSHER_SECRET=0935d7983bd261e5d8b8
PUSHER_CLUSTER=ap2
FRONTEND_URL=https://your-app.vercel.app
```

#### Frontend Variables:
```
VITE_PUSHER_KEY=b19873f36faedd774331
VITE_PUSHER_CLUSTER=ap2
```

**Important:** For `JWT_SECRET`, generate a secure random string:
```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Step 5: Update FRONTEND_URL

After first deployment, get your Vercel URL (e.g., `https://sentinel-xyz.vercel.app`)

Then update the `FRONTEND_URL` environment variable with your actual Vercel URL.

### Step 6: Redeploy
```bash
vercel --prod
```

## 🎯 What Works

✅ **User Authentication** - Register, login, JWT tokens
✅ **User Management** - Admin can manage roles
✅ **Video Upload** - Upload videos (stored in MongoDB temporarily)
✅ **Video List** - View all organization videos
✅ **Real-time Updates** - Pusher provides live processing updates
✅ **Multi-tenant** - Organization-based data isolation

## ⚠️ Current Limitations

❌ **Video Storage** - Videos stored temporarily (will be deleted after function timeout)
❌ **Video Processing** - Limited to 60 seconds (Vercel limit)
❌ **Video Streaming** - Won't work without permanent storage

## 🔧 To Enable Full Video Features

You'll need **Cloudinary** for permanent video storage:

1. **Sign up at** https://cloudinary.com (free tier: 25GB)
2. **Get credentials** from dashboard:
   - Cloud Name
   - API Key
   - API Secret
3. **Add to Vercel** environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. **Redeploy**: `vercel --prod`

## 📊 Test Your Deployment

1. Visit your Vercel URL
2. **Register** a new account
3. **Login** with credentials
4. **Upload a small video** (< 10MB for testing)
5. **Watch real-time progress** updates via Pusher
6. **View video library**

## 🐛 Troubleshooting

### "Database connection failed"
- Verify MongoDB Atlas allows connections from `0.0.0.0/0`
- Check `MONGODB_URI` includes username/password
- Test connection string locally

### "Pusher not connecting"
- Verify `VITE_PUSHER_KEY` and `VITE_PUSHER_CLUSTER` are set
- Check Pusher dashboard for connection logs
- Ensure keys match between frontend and backend

### "Video upload fails"
- Without Cloudinary, uploads will fail after 60 seconds
- Use small test videos (< 10MB)
- Check Vercel function logs: `vercel logs`

### "Real-time updates not working"
- Verify Pusher credentials are correct
- Check browser console for Pusher errors
- Ensure you're using Pusher free tier (100 concurrent connections)

## 📈 Monitor Your App

### View Logs:
```bash
vercel logs
```

### View Deployments:
```bash
vercel ls
```

### Open Dashboard:
```bash
vercel open
```

## 🔒 Security Checklist

- ✅ Strong JWT_SECRET (32+ characters)
- ✅ Environment variables secured in Vercel
- ✅ MongoDB IP whitelist configured
- ✅ HTTPS enabled (Vercel default)
- ✅ CORS configured for your domain

## 💰 Cost Estimate

**Free Tier (Current Setup):**
- Vercel: Free (100GB bandwidth)
- MongoDB Atlas: Free (512MB storage)
- Pusher: Free (100 concurrent connections)
- **Total: $0/month**

**With Cloudinary:**
- Cloudinary: Free (25GB storage + bandwidth)
- **Total: Still $0/month** (all free tiers)

## 🎉 You're Ready!

Your app is now deployed on Vercel!

**Next Steps:**
1. Share your Vercel URL
2. Test all features
3. Add Cloudinary when ready for video storage
4. Monitor usage to stay within free tiers

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Pusher Docs: https://pusher.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com

**GitHub Repo:** https://github.com/Animesh721/Sentinel
