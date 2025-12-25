# Vercel Deployment Guide

This guide will help you deploy the Sentinel application to Vercel with all necessary cloud services.

## Architecture Changes for Vercel

The application has been refactored for serverless deployment with the following changes:

1. **File Storage**: Local file system → Cloudinary
2. **Video Processing**: FFmpeg → Cloudinary + Cloud Functions
3. **Real-time Communication**: Socket.io → Pusher
4. **Backend Structure**: Express routes → Serverless API routes
5. **Database Connection**: Persistent connection → Connection pooling

## Prerequisites

Before deploying, you need to set up the following services:

### 1. MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist all IP addresses (0.0.0.0/0) for serverless
5. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/sentinel`)

### 2. Cloudinary (Video Storage & Processing)

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. From the dashboard, note:
   - Cloud Name
   - API Key
   - API Secret

### 3. Pusher (Real-time Communication)

1. Go to [Pusher](https://pusher.com/)
2. Sign up for a free account
3. Create a new Channels app
4. From the App Keys tab, note:
   - App ID
   - Key
   - Secret
   - Cluster

## Deployment Steps

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 4: Configure Environment Variables

You'll need to set these environment variables in Vercel:

#### Backend Environment Variables:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sentinel
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
FRONTEND_URL=https://your-app.vercel.app
```

#### Frontend Environment Variables:

```bash
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=your_pusher_cluster
```

### Step 5: Deploy to Vercel

From the project root directory:

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **sentinel** (or your preferred name)
- In which directory is your code located? **.**

### Step 6: Add Environment Variables via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all the environment variables listed in Step 4
5. Make sure to select the appropriate environment (Production, Preview, Development)

### Step 7: Redeploy

After adding environment variables:

```bash
vercel --prod
```

## Post-Deployment Configuration

### 1. Update FRONTEND_URL

After your first deployment, update the `FRONTEND_URL` environment variable with your actual Vercel URL:

```
FRONTEND_URL=https://your-actual-app.vercel.app
```

Then redeploy:

```bash
vercel --prod
```

### 2. Create Test Users

You can use the scripts in `backend/scripts/` to create test users. However, since we're using serverless, you'll need to either:

**Option A: Run scripts locally** (pointing to production MongoDB):
```bash
cd backend
MONGODB_URI=your_production_mongodb_uri node scripts/createTestUser.js
```

**Option B: Use the Register API** endpoint directly from the deployed app.

### 3. Configure CORS

The application is configured to accept requests from the Vercel domain. If you have a custom domain, update the CORS configuration in the API routes.

## Architecture Overview

### File Structure

```
pulsegen-assignment/
├── backend/
│   ├── api/                    # Serverless API routes
│   │   ├── auth/
│   │   │   ├── register.js     # POST /api/auth/register
│   │   │   ├── login.js        # POST /api/auth/login
│   │   │   └── me.js           # GET /api/auth/me
│   │   ├── users/
│   │   │   ├── index.js        # GET /api/users
│   │   │   └── [id]/
│   │   │       └── role.js     # PATCH /api/users/:id/role
│   │   ├── videos/
│   │   │   ├── index.js        # GET /api/videos
│   │   │   ├── upload.js       # POST /api/videos/upload
│   │   │   └── [id]/
│   │   │       ├── index.js    # GET /api/videos/:id
│   │   │       ├── delete.js   # DELETE /api/videos/:id
│   │   │       └── stream.js   # GET /api/videos/:id/stream
│   │   ├── models/             # Mongoose models
│   │   ├── middleware/         # Auth & tenant middleware
│   │   └── utils/              # DB, Cloudinary, Pusher utilities
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx  # Updated for Pusher
│   │   ├── pages/
│   │   └── ...
│   └── package.json
└── vercel.json                 # Vercel configuration
```

### API Routes

All API routes are now serverless functions:

- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- **Users**: `/api/users`, `/api/users/:id/role`
- **Videos**:
  - `/api/videos` - List videos
  - `/api/videos/upload` - Upload video
  - `/api/videos/:id` - Get video details
  - `/api/videos/:id/delete` - Delete video
  - `/api/videos/:id/stream` - Stream video (redirects to Cloudinary)

### Real-time Events

Pusher channels are used for real-time updates:

- **Channel**: `org-{organization}`
- **Events**:
  - `video:progress` - Processing progress updates
  - `video:complete` - Video processing completed
  - `video:error` - Processing error

## Video Upload Flow

1. User selects video file in frontend
2. Frontend uploads video directly to Cloudinary (or sends to API)
3. API creates database record with Cloudinary URL
4. Background processing starts (sensitivity analysis)
5. Progress updates sent via Pusher
6. Video ready for streaming from Cloudinary

## Limitations & Considerations

### Vercel Free Tier Limits:

- **Function Execution**: 60 seconds max (Hobby tier)
- **Bandwidth**: 100GB/month
- **Function Size**: 50MB
- **Serverless Function Memory**: 1024MB

### Cloudinary Free Tier:

- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month

### Pusher Free Tier:

- **Connections**: 100 max concurrent
- **Messages**: 200k/day

## Troubleshooting

### "Function execution timeout"

If video processing takes longer than 60 seconds, consider:
1. Using Cloudinary's webhooks for async processing
2. Upgrading to Vercel Pro (300s timeout)
3. Moving processing to a separate service

### "Database connection failed"

- Verify MongoDB Atlas allows connections from `0.0.0.0/0`
- Check your `MONGODB_URI` includes username/password
- Ensure the database user has read/write permissions

### "CORS errors"

- Make sure `FRONTEND_URL` is set correctly
- Check that the frontend is making requests to the correct API URL

### "Pusher not connecting"

- Verify `VITE_PUSHER_KEY` and `VITE_PUSHER_CLUSTER` are set in frontend
- Check Pusher dashboard for connection logs
- Ensure Pusher app credentials are correct in backend

## Monitoring & Logs

### View Logs:

```bash
vercel logs
```

### View Deployment Status:

```bash
vercel ls
```

### Inspect a Specific Deployment:

```bash
vercel inspect [deployment-url]
```

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `FRONTEND_URL` environment variable

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Commits to `main` branch
- **Preview**: Pull requests and other branches

To disable auto-deployment, go to Settings → Git in Vercel Dashboard.

## Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string (min 32 chars)
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB IP whitelist if possible
- [ ] Review Cloudinary upload presets
- [ ] Set up Pusher authentication if needed
- [ ] Enable HTTPS only (Vercel does this by default)
- [ ] Review CORS settings

## Support

For issues:
1. Check Vercel deployment logs
2. Review MongoDB Atlas logs
3. Check Cloudinary dashboard for upload errors
4. Review Pusher debug console

## Cost Optimization

To stay within free tiers:
1. Implement video file size limits
2. Add rate limiting to API routes
3. Use Cloudinary's transformation caching
4. Monitor usage dashboards regularly

## Next Steps

After successful deployment:
1. Test all features (register, login, upload, stream)
2. Monitor error rates and performance
3. Set up alerts for quota limits
4. Consider implementing CDN for frontend assets
5. Add database backups (MongoDB Atlas automated backups)

---

**Deployed successfully?** Share your Vercel URL and enjoy your serverless video platform!
