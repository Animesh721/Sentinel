# Setup Guide

## Quick Start

### 1. Install Dependencies

From the root directory:
```bash
npm run install:all
```

Or manually:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Setup Environment Variables

**Backend:**
```bash
cd backend
cp env.example .env
```

Edit `backend/.env` and update:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A secure random string for JWT tokens
- `FRONTEND_URL` - Frontend URL (default: http://localhost:5173)

### 3. Install FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
# Add to PATH after installation
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

Verify installation:
```bash
ffmpeg -version
```

### 4. Start MongoDB

**Local MongoDB:**
```bash
# Make sure MongoDB is running
mongod
```

**MongoDB Atlas:**
- Create a free cluster at https://www.mongodb.com/cloud/atlas
- Get connection string
- Update `MONGODB_URI` in `.env`

### 5. Run the Application

**Option 1: Run both servers together**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## First Steps

1. **Register a new account:**
   - Go to http://localhost:5173/register
   - Create an account (choose role: viewer, editor, or admin)

2. **Login:**
   - Use your credentials to login

3. **Upload a video:**
   - Navigate to Upload page (Editor/Admin only)
   - Select a video file (max 500MB)
   - Watch real-time processing progress

4. **View videos:**
   - Check Dashboard for recent videos
   - Go to Library for all videos
   - Click "Watch" to stream videos

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running: `mongosh` or check MongoDB Compass
- Check connection string format: `mongodb://localhost:27017/video-app`
- For Atlas: Ensure IP whitelist includes your IP

### FFmpeg Not Found
- Verify installation: `ffmpeg -version`
- Add FFmpeg to system PATH
- Restart terminal/IDE after installation

### Port Already in Use
- Change `PORT` in `backend/.env`
- Or kill process using port 5000 or 5173

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches frontend URL
- Check browser console for specific CORS errors

### Video Upload Fails
- Check file size (max 500MB)
- Verify file is a valid video format
- Check backend logs for errors
- Ensure uploads directory exists and is writable

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Use process manager (PM2, Forever)
3. Configure reverse proxy (Nginx)
4. Use cloud storage for videos (AWS S3, etc.)

### Frontend
1. Build: `cd frontend && npm run build`
2. Serve `dist/` folder with static server
3. Configure API proxy if needed

## Environment Variables Reference

### Backend (.env)
```
PORT=5000                          # Server port
MONGODB_URI=mongodb://...          # MongoDB connection
JWT_SECRET=your-secret-key         # JWT signing key
JWT_EXPIRE=7d                      # Token expiration
NODE_ENV=development               # Environment
FRONTEND_URL=http://localhost:5173 # Frontend URL for CORS
```

