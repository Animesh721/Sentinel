# Architecture Overview

## System Architecture

```
┌─────────────────┐
│   React Frontend │
│   (Vite + React) │
└────────┬────────┘
         │ HTTP/REST API
         │ Socket.io (WebSocket)
         ▼
┌─────────────────┐
│  Express Backend │
│  (Node.js)       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│ MongoDB │ │  File   │
│         │ │ Storage │
└────────┘ └──────────┘
```

## Component Architecture

### Backend Components

#### 1. Authentication Layer
- **JWT-based authentication**
- Password hashing with bcrypt
- Token validation middleware
- User session management

#### 2. Authorization Layer
- Role-based access control (RBAC)
- Multi-tenant isolation
- Resource ownership validation
- Permission middleware

#### 3. Video Processing Pipeline
```
Upload → Validation → Storage → Metadata Extraction → Sensitivity Analysis → Completion
```

#### 4. Real-Time Communication
- Socket.io for WebSocket connections
- Organization-based room isolation
- Progress event broadcasting
- Error handling and notifications

#### 5. Video Streaming
- HTTP range request support
- Efficient partial content delivery
- MIME type handling
- File system streaming

### Frontend Components

#### 1. State Management
- React Context API for global state
- AuthContext for user authentication
- SocketContext for real-time updates
- Local state for component-specific data

#### 2. Routing
- React Router for navigation
- Protected routes with role-based access
- Dynamic route parameters

#### 3. Real-Time Updates
- Socket.io client integration
- Event-driven UI updates
- Progress tracking
- Status synchronization

## Data Flow

### Video Upload Flow
```
User → Frontend → Upload API → File Storage → Video Model → Processing Service
                                                              ↓
                                                         Socket.io → Frontend
```

### Video Streaming Flow
```
User → Frontend → Stream API → File System → HTTP Range Response → Video Player
```

### Authentication Flow
```
User → Login API → JWT Generation → Token Storage → Protected Routes
```

## Database Schema

### User Model
```javascript
{
  username: String (unique, required)
  email: String (unique, required)
  password: String (hashed, required)
  role: Enum ['viewer', 'editor', 'admin']
  organization: String (default: 'default')
  createdAt: Date
}
```

### Video Model
```javascript
{
  filename: String (required)
  originalName: String (required)
  path: String (required)
  size: Number (required)
  mimeType: String (required)
  duration: Number
  status: Enum ['uploading', 'processing', 'completed', 'failed']
  sensitivityStatus: Enum ['safe', 'flagged', 'pending']
  processingProgress: Number (0-100)
  uploadedBy: ObjectId (ref: User)
  organization: String (required)
  metadata: {
    width: Number
    height: Number
    bitrate: Number
    codec: String
  }
  createdAt: Date
  updatedAt: Date
}
```

## Security Architecture

### Authentication
- JWT tokens with expiration
- Secure password hashing (bcrypt)
- Token validation on protected routes

### Authorization
- Role-based permissions
- Multi-tenant data isolation
- Resource ownership checks
- API endpoint protection

### Data Isolation
- Organization-based filtering
- User-specific data access
- Cross-tenant prevention

## API Design

### RESTful Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/videos/upload` - Upload video
- `GET /api/videos` - List videos (with filters)
- `GET /api/videos/:id` - Get video details
- `GET /api/videos/:id/stream` - Stream video
- `DELETE /api/videos/:id` - Delete video
- `GET /api/users` - List users (admin)
- `PATCH /api/users/:id/role` - Update role (admin)

### WebSocket Events
- `video:subscribe` - Subscribe to video updates
- `video:progress` - Processing progress update
- `video:complete` - Processing completion
- `video:error` - Processing error

## Multi-Tenant Architecture

### Organization Isolation
- Each user belongs to an organization
- Data filtered by organization
- Cross-organization access prevented

### Role-Based Access
- **Viewer**: Own videos only
- **Editor**: All org videos, upload/delete
- **Admin**: All org videos, user management

## Video Processing Architecture

### Processing Stages
1. **Upload**: File received and stored
2. **Validation**: File type and size check
3. **Metadata Extraction**: FFmpeg analysis
4. **Sensitivity Analysis**: Content screening
5. **Completion**: Status update and notification

### Progress Tracking
- Real-time progress updates via Socket.io
- Percentage-based progress (0-100%)
- Status transitions (uploading → processing → completed)

## Scalability Considerations

### Current Architecture
- Single server deployment
- Local file storage
- In-memory Socket.io connections

### Future Enhancements
- Horizontal scaling with Redis adapter
- Cloud storage (S3, GCS)
- Queue-based processing (Bull, RabbitMQ)
- CDN integration for streaming
- Load balancing
- Database sharding

## Error Handling

### Backend
- Try-catch blocks for async operations
- Error middleware for centralized handling
- Validation errors with clear messages
- Database error handling

### Frontend
- Error boundaries for React components
- API error handling with user feedback
- Network error handling
- Validation error display

## Performance Optimizations

### Backend
- Efficient database queries with indexes
- Streaming for large file uploads
- HTTP range requests for video streaming
- Connection pooling for MongoDB

### Frontend
- Code splitting with React Router
- Lazy loading for routes
- Optimistic UI updates
- Efficient re-renders with React hooks

## Testing Strategy

### Unit Tests
- Model validation
- Middleware functions
- Utility functions

### Integration Tests
- API endpoint testing
- Authentication flow
- Video processing pipeline

### E2E Tests
- Complete user workflows
- Multi-user scenarios
- Real-time updates

## Deployment Architecture

### Development
- Local MongoDB
- Local file storage
- Development servers

### Production
- Cloud database (MongoDB Atlas)
- Cloud storage (AWS S3, etc.)
- Process manager (PM2)
- Reverse proxy (Nginx)
- SSL/TLS certificates
- Environment-specific configs

