# Video Upload, Sensitivity Processing, and Streaming Application

A comprehensive full-stack application that enables users to upload videos, processes them for content sensitivity analysis, and provides seamless video streaming capabilities with real-time progress tracking.

## Features

- ✅ **Video Upload**: Secure video upload with progress tracking
- ✅ **Real-Time Processing**: Live updates on video processing status using Socket.io
- ✅ **Content Sensitivity Analysis**: Automated content screening and classification (safe/flagged)
- ✅ **Video Streaming**: HTTP range request support for efficient video playback
- ✅ **Multi-Tenant Architecture**: User isolation with organization-based data segregation
- ✅ **Role-Based Access Control**: Viewer, Editor, and Admin roles with appropriate permissions
- ✅ **Video Library**: Comprehensive video management with filtering capabilities
- ✅ **Responsive Design**: Modern, intuitive user interface

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Multer** for file uploads
- **FFmpeg** for video processing

### Frontend
- **React** with Vite
- **React Router** for navigation
- **Axios** for HTTP requests
- **Socket.io Client** for real-time updates
- **CSS Modules** for styling

## Project Structure

```
pulsegen-assignment/
├── backend/
│   ├── models/          # MongoDB models (User, Video)
│   ├── routes/          # API routes (auth, videos, users)
│   ├── middleware/      # Authentication, authorization, multi-tenant
│   ├── services/        # Video processing service
│   ├── socket/          # Socket.io handlers
│   ├── uploads/         # Video storage directory
│   └── server.js        # Express server setup
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context (Auth, Socket)
│   │   └── App.jsx      # Main app component
│   └── vite.config.js   # Vite configuration
└── README.md
```

## Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- FFmpeg (for video processing)

### Install FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
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

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
UPLOAD_PATH=./uploads/videos
PROCESSED_PATH=./uploads/processed
```

5. Start MongoDB (if running locally):
```bash
# Make sure MongoDB is running on your system
```

6. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

### Running Both Servers

From the root directory:
```bash
npm run install:all  # Install all dependencies
npm run dev          # Run both backend and frontend
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Videos
- `POST /api/videos/upload` - Upload video (Editor/Admin only)
- `GET /api/videos` - Get all videos (with filters)
- `GET /api/videos/:id` - Get single video
- `GET /api/videos/:id/stream` - Stream video (range request support)
- `DELETE /api/videos/:id` - Delete video (Editor/Admin only)

### Users (Admin only)
- `GET /api/users` - Get all users
- `PATCH /api/users/:id/role` - Update user role

## User Roles

### Viewer
- View assigned videos
- Stream videos
- Read-only access

### Editor
- All Viewer permissions
- Upload videos
- Delete own videos
- View all organization videos

### Admin
- All Editor permissions
- Manage user roles
- Delete any video in organization
- Full system access

## Multi-Tenant Architecture

The application implements multi-tenant isolation:
- Each user belongs to an organization
- Users can only access videos from their organization
- Data is segregated by organization
- Viewers only see videos they uploaded
- Editors/Admins see all videos in their organization

## Video Processing Pipeline

1. **Upload**: Video file is uploaded and stored
2. **Validation**: File type, size, and format verification
3. **Metadata Extraction**: Video properties extracted using FFmpeg
4. **Sensitivity Analysis**: Content screening and classification
5. **Status Updates**: Real-time progress communicated via Socket.io
6. **Completion**: Video marked as completed and ready for streaming

## Real-Time Updates

The application uses Socket.io for real-time communication:
- Upload progress tracking
- Processing status updates
- Completion notifications
- Error handling

## Video Streaming

Videos are streamed using HTTP range requests:
- Supports seeking and partial content requests
- Efficient bandwidth usage
- Compatible with HTML5 video players

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - Token expiration time
- `NODE_ENV` - Environment (development/production)
- `UPLOAD_PATH` - Video upload directory
- `PROCESSED_PATH` - Processed video directory

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Multi-tenant data isolation
- File upload validation
- Secure API endpoints

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

## Production Build

### Frontend
```bash
cd frontend
npm run build
npm run preview  # Preview production build
```

### Backend
```bash
cd backend
npm start  # Production mode
```

## Testing

1. Register a new user (or use existing credentials)
2. Login to the application
3. Upload a video file
4. Watch real-time processing progress
5. View processed videos in the library
6. Stream videos using the video player

## Demo Accounts

You can create accounts with different roles:
- **Viewer**: Can view and stream videos
- **Editor**: Can upload, view, and manage videos
- **Admin**: Full access including user management

## Troubleshooting

### FFmpeg not found
- Ensure FFmpeg is installed and in your PATH
- Verify installation: `ffmpeg -version`

### MongoDB connection error
- Check MongoDB is running
- Verify connection string in `.env`
- For MongoDB Atlas, ensure IP whitelist includes your IP

### Port already in use
- Change PORT in `.env` file
- Or stop the process using the port

### CORS errors
- Ensure frontend URL is correct in backend Socket.io config
- Check CORS settings in `server.js`

## Future Enhancements

- [ ] Advanced video compression
- [ ] CDN integration
- [ ] Video thumbnails generation
- [ ] Advanced filtering and search
- [ ] Video analytics
- [ ] Batch upload support
- [ ] Video editing capabilities
- [ ] Integration with ML models for better sensitivity detection

## License

ISC

## Author

Created for PulseGen Assignment

