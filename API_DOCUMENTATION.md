# Sentinel API Documentation

## Overview

Sentinel is a content analysis platform that enables users to upload videos, process them for content sensitivity analysis, and stream videos with real-time progress tracking via WebSockets.

**Base URL:** `http://localhost:5000/api`

**Frontend URL:** `http://localhost:5174`

---

## Authentication

### JWT Token Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Token Storage

Tokens are returned on login/registration and should be stored in `localStorage` on the frontend under the key `token`.

---

## Endpoints

### 1. Authentication Endpoints

#### 1.1 Register User

**Endpoint:** `POST /auth/register`

**Description:** Create a new user account

**Request Body:**
```json
{
  "username": "string (required, min 3 chars, unique)",
  "email": "string (required, valid email, unique)",
  "password": "string (required, min 6 chars)",
  "role": "string (optional, default: 'viewer', enum: ['viewer', 'editor', 'admin'])",
  "organization": "string (optional, default: 'default')"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "viewer",
    "organization": "default"
  }
}
```

**Error Responses:**
- `400 Bad Request` - User already exists
- `500 Server Error` - Registration failed

---

#### 1.2 Login User

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "editor",
    "organization": "default"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing email or password
- `401 Unauthorized` - Invalid credentials
- `500 Server Error` - Login failed

---

#### 1.3 Get Current User

**Endpoint:** `GET /auth/me`

**Description:** Get information about the authenticated user

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "editor",
    "organization": "default"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User not found
- `500 Server Error` - Request failed

---

### 2. Video Endpoints

#### 2.1 Upload Video

**Endpoint:** `POST /videos/upload`

**Description:** Upload a video file for processing

**Authentication:** Required (Editor or Admin role)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:** Form Data
```
video: File (required, max 500MB)
  - Accepted types: video/mp4, video/webm, video/ogg, video/quicktime, video/x-msvideo
```

**Response:** `201 Created`
```json
{
  "message": "Video uploaded successfully",
  "video": {
    "id": "507f1f77bcf86cd799439012",
    "filename": "1703000000000-123456789.mp4",
    "originalName": "sample.mp4",
    "status": "uploading",
    "processingProgress": 0
  }
}
```

**Error Responses:**
- `400 Bad Request` - No file provided or invalid file type
- `401 Unauthorized` - Missing authentication
- `403 Forbidden` - Insufficient permissions (requires editor/admin role)
- `413 Payload Too Large` - File exceeds 500MB limit
- `500 Server Error` - Upload failed

---

#### 2.2 Get All Videos

**Endpoint:** `GET /videos`

**Description:** Retrieve all videos in the user's organization

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
status: string (optional, enum: ['uploading', 'processing', 'completed', 'failed'])
sensitivityStatus: string (optional, enum: ['safe', 'flagged', 'pending'])
search: string (optional, search in originalName and filename)
```

**Example Request:**
```
GET /videos?status=completed&sensitivityStatus=safe&search=video
```

**Response:** `200 OK`
```json
{
  "videos": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "originalName": "sample.mp4",
      "filename": "1703000000000-123456789.mp4",
      "size": 104857600,
      "mimeType": "video/mp4",
      "duration": 120,
      "status": "completed",
      "sensitivityStatus": "safe",
      "processingProgress": 100,
      "uploadedBy": {
        "_id": "507f1f77bcf86cd799439011",
        "username": "john_doe",
        "email": "john@example.com"
      },
      "organization": "default",
      "metadata": {
        "width": 1920,
        "height": 1080,
        "bitrate": 5000000,
        "codec": "h264"
      },
      "createdAt": "2024-12-20T10:30:00Z",
      "updatedAt": "2024-12-20T10:35:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing authentication
- `500 Server Error` - Failed to fetch videos

---

#### 2.3 Get Single Video

**Endpoint:** `GET /videos/:id`

**Description:** Get details of a specific video

**Authentication:** Required

**Parameters:**
```
id: string (required, MongoDB ObjectId)
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "video": {
    "_id": "507f1f77bcf86cd799439012",
    "originalName": "sample.mp4",
    "filename": "1703000000000-123456789.mp4",
    "size": 104857600,
    "mimeType": "video/mp4",
    "duration": 120,
    "status": "completed",
    "sensitivityStatus": "safe",
    "processingProgress": 100,
    "uploadedBy": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "organization": "default",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "bitrate": 5000000,
      "codec": "h264"
    },
    "createdAt": "2024-12-20T10:30:00Z",
    "updatedAt": "2024-12-20T10:35:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing authentication
- `403 Forbidden` - Access denied (video belongs to different organization)
- `404 Not Found` - Video not found
- `500 Server Error` - Failed to fetch video

---

#### 2.4 Stream Video

**Endpoint:** `GET /videos/:id/stream`

**Description:** Stream video with HTTP range request support

**Authentication:** Required (Bearer token or query parameter)

**Parameters:**
```
id: string (required, MongoDB ObjectId)
```

**Headers:**
```
Authorization: Bearer <token>
```

OR

**Query Parameters:**
```
token: string (optional, for HTML5 video element support)
```

**Supported Headers:**
- `Range: bytes=start-end` - For range requests (HTTP 206 Partial Content)

**Response:** `200 OK` or `206 Partial Content`
```
Content-Type: video/mp4
Content-Length: <size>
Accept-Ranges: bytes
```

**Example cURL Request:**
```bash
curl -H "Authorization: Bearer <token>" \
  -H "Range: bytes=0-1023" \
  http://localhost:5000/api/videos/507f1f77bcf86cd799439012/stream
```

**Error Responses:**
- `401 Unauthorized` - Missing authentication
- `403 Forbidden` - Access denied
- `404 Not Found` - Video not found or file missing
- `500 Server Error` - Streaming failed

---

#### 2.5 Delete Video

**Endpoint:** `DELETE /videos/:id`

**Description:** Delete a video (only for editors/admins who own it, or admins)

**Authentication:** Required (Editor or Admin role)

**Parameters:**
```
id: string (required, MongoDB ObjectId)
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Video deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing authentication
- `403 Forbidden` - Insufficient permissions (viewers cannot delete)
- `404 Not Found` - Video not found
- `500 Server Error` - Delete failed

---

### 3. User Management Endpoints

#### 3.1 Get All Users

**Endpoint:** `GET /users`

**Description:** Get all users in the same organization (admin only)

**Authentication:** Required (Admin role)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "editor",
      "organization": "default",
      "createdAt": "2024-12-20T10:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing authentication
- `403 Forbidden` - Insufficient permissions (requires admin role)
- `500 Server Error` - Failed to fetch users

---

#### 3.2 Update User Role

**Endpoint:** `PATCH /users/:id/role`

**Description:** Update a user's role (admin only)

**Authentication:** Required (Admin role)

**Parameters:**
```
id: string (required, MongoDB ObjectId)
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "role": "string (required, enum: ['viewer', 'editor', 'admin'])"
}
```

**Response:** `200 OK`
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "editor"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid role
- `401 Unauthorized` - Missing authentication
- `403 Forbidden` - Insufficient permissions (requires admin role)
- `404 Not Found` - User not found or different organization
- `500 Server Error` - Update failed

---

## WebSocket Events (Socket.io)

### Connection

**URL:** `http://localhost:5000`

**Auth:**
```javascript
{
  auth: {
    token: '<JWT_TOKEN>'
  }
}
```

### Events

#### video:progress

**Emitted by:** Backend (during processing)

**Payload:**
```json
{
  "videoId": "507f1f77bcf86cd799439012",
  "progress": 50,
  "status": "processing"
}
```

**Description:** Real-time progress updates during video processing

---

#### video:complete

**Emitted by:** Backend (when processing finishes)

**Payload:**
```json
{
  "videoId": "507f1f77bcf86cd799439012",
  "status": "completed",
  "sensitivityStatus": "safe",
  "progress": 100
}
```

**Description:** Notification when video processing is complete

---

#### video:error

**Emitted by:** Backend (on processing error)

**Payload:**
```json
{
  "videoId": "507f1f77bcf86cd799439012",
  "status": "failed",
  "error": "Processing failed: FFmpeg error"
}
```

**Description:** Error notification if processing fails

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Successful request |
| 201 | Created - Resource created successfully |
| 206 | Partial Content - Range request successful |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 413 | Payload Too Large - File exceeds limit |
| 500 | Server Error - Internal server error |

---

## Video Status

- **uploading** - File is being uploaded
- **processing** - File is being processed (metadata extraction, sensitivity analysis)
- **completed** - Processing finished successfully
- **failed** - Processing failed

---

## Video Sensitivity Status

- **pending** - Analysis not yet complete
- **safe** - Content deemed safe
- **flagged** - Content flagged as potentially sensitive

---

## User Roles

| Role | Permissions |
|------|-------------|
| **viewer** | Can view and stream videos from their organization |
| **editor** | Can upload videos, view library, stream videos |
| **admin** | Can do everything + manage users and roles |

---

## Example Usage

### JavaScript (Axios)

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Login
const loginResponse = await axios.post(`${API_URL}/auth/login`, {
  email: 'editor@test.com',
  password: 'editor123'
});

const token = loginResponse.data.token;

// Set default header
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Upload video
const formData = new FormData();
formData.append('video', videoFile);

const uploadResponse = await axios.post(`${API_URL}/videos/upload`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

console.log('Video ID:', uploadResponse.data.video.id);

// Get videos
const videosResponse = await axios.get(`${API_URL}/videos?status=completed`);
console.log('Videos:', videosResponse.data.videos);

// Stream video
const videoUrl = `${API_URL}/videos/${videoId}/stream?token=${token}`;
```

### cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "editor@test.com",
    "password": "editor123"
  }' | jq '.token'

# Get videos
curl -X GET http://localhost:5000/api/videos \
  -H "Authorization: Bearer <TOKEN>"

# Upload video
curl -X POST http://localhost:5000/api/videos/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "video=@video.mp4"

# Delete video
curl -X DELETE http://localhost:5000/api/videos/<VIDEO_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing rate limiting using packages like `express-rate-limit`.

---

## CORS Configuration

The backend is configured to accept requests from the frontend URL specified in the `.env` file:

```
FRONTEND_URL=http://localhost:5174
```

---

## Error Handling

All errors follow this format:

```json
{
  "message": "Error description",
  "error": "Detailed error information (optional)"
}
```

---

## Testing Accounts

Run `node scripts/createTestUser.js` in the backend to create:

- **Admin**: admin@test.com / admin123
- **Editor**: editor@test.com / editor123
- **Viewer**: viewer@test.com / viewer123

---

## Support

For issues or questions, please refer to the main README.md file.
