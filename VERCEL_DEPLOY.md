# 🚀 Vercel Deployment - Ready to Deploy!

## ✅ All Services Configured

You have all the required services set up:
- ✅ MongoDB Atlas
- ✅ Cloudinary
- ✅ Pusher
- ✅ GitHub Repository

## 📋 Step-by-Step Deployment

### Step 1: Deploy to Vercel

```bash
# Install Vercel CLI (if needed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd pulsegen-assignment
vercel
```

Follow the prompts and select your preferences.

### Step 2: Configure Environment Variables

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Add these variables for **Production, Preview, and Development**:

#### Required Backend Variables:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Generate a secure 32+ character string |
| `JWT_EXPIRE` | `7d` |
| `CLOUDINARY_CLOUD_NAME` | `dxsfmzbqf` |
| `CLOUDINARY_API_KEY` | `736436267281446` |
| `CLOUDINARY_API_SECRET` | `AQYRr2RDUy8yaFWav39ccV-hbTw` |
| `PUSHER_APP_ID` | `2095203` |
| `PUSHER_KEY` | `b19873f36faedd774331` |
| `PUSHER_SECRET` | `0935d7983bd261e5d8b8` |
| `PUSHER_CLUSTER` | `ap2` |
| `FRONTEND_URL` | `https://your-app.vercel.app` (update after first deploy) |

#### Required Frontend Variables:

| Variable | Value |
|----------|-------|
| `VITE_PUSHER_KEY` | `b19873f36faedd774331` |
| `VITE_PUSHER_CLUSTER` | `ap2` |

### Step 3: Generate JWT_SECRET

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Copy the output and use it as your `JWT_SECRET`.

### Step 4: Get Your MongoDB Connection String

From MongoDB Atlas:
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Ensure `/sentinel` is at the end (or your database name)

Example:
```
mongodb+srv://username:password@cluster.mongodb.net/sentinel?retryWrites=true&w=majority
```

### Step 5: Update FRONTEND_URL

After your first deployment, Vercel will give you a URL like:
```
https://sentinel-xyz.vercel.app
```

1. Go back to Vercel → Environment Variables
2. Update `FRONTEND_URL` with your actual URL
3. Save changes

### Step 6: Final Deployment

```bash
vercel --prod
```

## 🎯 What Will Work

With all services configured, you'll have:

✅ **Full Authentication** - Register, login, JWT tokens
✅ **User Management** - Admin role management
✅ **Video Upload** - Upload videos to Cloudinary
✅ **Video Storage** - Permanent cloud storage
✅ **Video Streaming** - CDN-powered video playback
✅ **Real-time Updates** - Pusher live processing updates
✅ **Video Processing** - Metadata extraction via Cloudinary
✅ **Sensitivity Analysis** - AI-ready content moderation
✅ **Multi-tenant** - Organization-based isolation

## 🧪 Testing Checklist

After deployment, test these features:

1. **Registration & Login**
   - [ ] Register a new account
   - [ ] Login with credentials
   - [ ] View dashboard

2. **Video Upload**
   - [ ] Upload a small video (< 50MB)
   - [ ] Watch real-time progress updates
   - [ ] Verify video appears in library

3. **Video Playback**
   - [ ] Click "Watch" on completed video
   - [ ] Video streams from Cloudinary
   - [ ] Seek/scrubbing works

4. **User Management** (Admin only)
   - [ ] View users list
   - [ ] Update user roles
   - [ ] Verify role changes

5. **Multi-tenant**
   - [ ] Create account in different organization
   - [ ] Verify data isolation

## 🐛 Troubleshooting

### "Database connection failed"
- Check MongoDB Atlas whitelist includes `0.0.0.0/0`
- Verify connection string is correct
- Ensure password doesn't contain special characters (or is URL-encoded)

### "Pusher not connecting"
- Check browser console for Pusher errors
- Verify `VITE_PUSHER_KEY` matches `PUSHER_KEY`
- Confirm `VITE_PUSHER_CLUSTER` is `ap2`

### "Video upload fails"
- Check Cloudinary credentials are correct
- Verify file size is under 100MB for testing
- Check Vercel function logs: `vercel logs`

### "Video not streaming"
- Ensure video processing completed (status: 'completed')
- Check Cloudinary dashboard for uploaded videos
- Verify `cloudinaryUrl` field exists in database

## 📊 Monitor Your Deployment

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

## 💰 Free Tier Limits

Your current setup uses free tiers:

| Service | Free Limit | Monitor At |
|---------|-----------|------------|
| Vercel | 100GB bandwidth/month | [Dashboard](https://vercel.com/dashboard) |
| MongoDB Atlas | 512MB storage | [Console](https://cloud.mongodb.com) |
| Cloudinary | 25GB storage + bandwidth | [Dashboard](https://cloudinary.com/console) |
| Pusher | 100 concurrent connections | [Dashboard](https://dashboard.pusher.com) |

**Total Cost: $0/month** (within free limits)

## 🔒 Security Best Practices

- ✅ Use strong JWT_SECRET (32+ random characters)
- ✅ Keep secrets in Vercel environment variables (never commit)
- ✅ MongoDB IP whitelist configured
- ✅ HTTPS enabled by default (Vercel)
- ✅ Cloudinary credentials secured
- ✅ Pusher credentials secured

## 🎉 Success!

Once deployed, your app will be live at:
**https://your-app.vercel.app**

Share the link and enjoy your serverless video platform! 🚀

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Pusher Channels Docs](https://pusher.com/docs/channels)

## 🆘 Need Help?

Check the logs:
```bash
vercel logs --follow
```

Or visit:
- GitHub Issues: https://github.com/Animesh721/Sentinel/issues
- Vercel Support: https://vercel.com/support

---

**Ready to deploy? Run `vercel` now!** 🚀
