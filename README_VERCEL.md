# Sentinel - Vercel Serverless Edition

A serverless video upload, processing, and streaming platform with real-time content sensitivity analysis. Built for deployment on Vercel with Cloudinary and Pusher.

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fsentinel)

**New to Vercel?** Follow the [Quick Start Guide](QUICK_START.md) for a 15-minute deployment.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICK_START.md](QUICK_START.md) | 15-minute deployment guide |
| [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) | Complete deployment documentation |
| [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) | Technical changes from original version |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | API endpoint reference |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture (updated for serverless) |

## ✨ Features

- **Video Upload**: Upload videos up to 500MB with progress tracking
- **Real-time Processing**: Live updates via Pusher during video processing
- **Content Moderation**: Automated sensitivity analysis (AI-ready)
- **Video Streaming**: CDN-powered streaming via Cloudinary
- **Multi-tenant**: Organization-based data isolation
- **Role-Based Access**: Viewer, Editor, and Admin roles
- **Serverless Architecture**: Auto-scaling, zero server maintenance

## 🏗️ Tech Stack

### Frontend
- React 18
- Vite
- Axios
- Pusher JS
- React Router

### Backend
- Vercel Serverless Functions
- Node.js
- MongoDB (Mongoose)
- JWT Authentication

### Cloud Services
- **Vercel**: Hosting & serverless functions
- **MongoDB Atlas**: Database
- **Cloudinary**: Video storage & processing
- **Pusher**: Real-time communication

## 🔧 Prerequisites

- Node.js 18+
- Free accounts on:
  - [Vercel](https://vercel.com)
  - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  - [Cloudinary](https://cloudinary.com)
  - [Pusher](https://pusher.com)

## 📦 Installation

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd pulsegen-assignment

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Set up environment variables
cp backend/api/.env.example backend/api/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your credentials

# Run backend (with serverless emulation)
cd backend
npm run dev

# Run frontend
cd frontend
npm run dev
```

### Production Deployment

See [QUICK_START.md](QUICK_START.md) for step-by-step instructions.

## 🌍 Environment Variables

### Backend (Vercel)

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend

```env
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=your_pusher_cluster
```

## 📁 Project Structure

```
pulsegen-assignment/
├── backend/
│   ├── api/                    # Serverless functions
│   │   ├── auth/              # Authentication endpoints
│   │   ├── users/             # User management
│   │   ├── videos/            # Video operations
│   │   ├── models/            # Mongoose models
│   │   ├── middleware/        # Auth & multi-tenant
│   │   └── utils/             # DB, Cloudinary, Pusher
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
├── vercel.json                # Vercel configuration
├── QUICK_START.md             # Fast deployment guide
├── VERCEL_DEPLOYMENT.md       # Full documentation
└── MIGRATION_SUMMARY.md       # Technical details
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Videos
- `GET /api/videos` - List videos (with filters)
- `POST /api/videos/upload` - Upload video
- `GET /api/videos/:id` - Get video details
- `DELETE /api/videos/:id` - Delete video
- `GET /api/videos/:id/stream` - Stream video

### Users (Admin only)
- `GET /api/users` - List organization users
- `PATCH /api/users/:id/role` - Update user role

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| **Viewer** | View videos in organization |
| **Editor** | Upload videos, delete own videos, view library |
| **Admin** | All Editor permissions + manage user roles |

## 📊 Real-time Events

Pusher channels for live updates:

- **Channel**: `org-{organization}`
- **Events**:
  - `video:progress` - Processing progress (10%, 50%, 70%, 90%)
  - `video:complete` - Video ready
  - `video:error` - Processing failed

## 🧪 Testing

Create test users with different roles:

```bash
# Register via API
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "editor"
  }'
```

## 🚨 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Database connection failed | Check MongoDB Atlas allows `0.0.0.0/0` |
| Pusher not connecting | Verify `VITE_PUSHER_KEY` matches backend `PUSHER_KEY` |
| CORS errors | Set `FRONTEND_URL` to your Vercel URL |
| Function timeout | Use smaller videos or upgrade Vercel plan |

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed troubleshooting.

## 💰 Cost Estimate

### Free Tier (Recommended for Testing)
- Vercel: Free (100GB bandwidth)
- MongoDB Atlas: Free (512MB storage)
- Cloudinary: Free (25GB bandwidth)
- Pusher: Free (100 concurrent connections)
- **Total: $0/month**

### Production Tier
- Vercel Pro: $20/month
- MongoDB Atlas: $9+/month
- Cloudinary: $99+/month
- Pusher: $49+/month
- **Total: ~$177/month**

## 📈 Scaling Considerations

Free tier limits:
- **Videos**: ~1000 videos (25GB Cloudinary)
- **Concurrent Users**: 100 (Pusher limit)
- **Bandwidth**: 100GB/month (Vercel)
- **Video Upload Size**: 100MB recommended

## 🔄 Differences from Original Version

This serverless version replaces:
- Socket.io → Pusher
- FFmpeg → Cloudinary
- Local file storage → Cloud storage
- Traditional server → Serverless functions

See [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) for complete details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally and on Vercel preview
5. Submit a pull request

## 📄 License

ISC

## 🆘 Support

- **Deployment Issues**: See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- **API Questions**: See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Quick Help**: See [QUICK_START.md](QUICK_START.md)

## ⭐ Acknowledgments

Built with:
- Vercel Serverless Platform
- Cloudinary Media Platform
- Pusher Real-time Service
- MongoDB Atlas

---

**Ready to deploy?** Start with [QUICK_START.md](QUICK_START.md)!
