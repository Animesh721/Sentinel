import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Video from '../models/Video.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { enforceTenantIsolation, checkResourceOwnership } from '../middleware/multiTenant.js';
import { processVideo } from '../services/videoProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads/videos');
const processedDir = path.join(__dirname, '../uploads/processed');

[uploadDir, processedDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Upload video
router.post('/upload', 
  authenticate, 
  authorize('editor', 'admin'),
  enforceTenantIsolation,
  upload.single('video'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No video file provided' });
      }

      const video = await Video.create({
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user._id,
        organization: req.user.organization,
        status: 'uploading'
      });

      // Start processing in background
      processVideo(video._id.toString(), req.user.organization);

      res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          id: video._id,
          filename: video.filename,
          originalName: video.originalName,
          status: video.status,
          processingProgress: video.processingProgress
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Upload failed', error: error.message });
    }
  }
);

// Get all videos (with tenant isolation)
router.get('/', 
  authenticate, 
  enforceTenantIsolation,
  async (req, res) => {
    try {
      const { status, sensitivityStatus, search } = req.query;
      const query = { organization: req.user.organization };

      // Multi-tenant: All users in the same organization can see all videos
      // Viewers have read-only access (can view but not upload/delete)
      // Editors and Admins can upload and manage videos

      if (status) query.status = status;
      if (sensitivityStatus) query.sensitivityStatus = sensitivityStatus;
      if (search) {
        query.$or = [
          { originalName: { $regex: search, $options: 'i' } },
          { filename: { $regex: search, $options: 'i' } }
        ];
      }

      const videos = await Video.find(query)
        .populate('uploadedBy', 'username email')
        .sort({ createdAt: -1 });

      res.json({ videos });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch videos', error: error.message });
    }
  }
);

// Get single video
router.get('/:id', 
  authenticate, 
  enforceTenantIsolation,
  checkResourceOwnership,
  async (req, res) => {
    try {
      const video = await Video.findById(req.params.id)
        .populate('uploadedBy', 'username email');

      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }

      res.json({ video });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch video', error: error.message });
    }
  }
);

// Stream video with range support
// Support both header-based auth and query param auth (for HTML5 video elements)
router.get('/:id/stream', 
  async (req, res, next) => {
    // If no auth header, try token from query params (for HTML5 video elements)
    if (!req.headers.authorization && req.query.token) {
      req.headers.authorization = `Bearer ${req.query.token}`;
    }
    next();
  },
  authenticate, 
  enforceTenantIsolation,
  checkResourceOwnership,
  async (req, res) => {
    try {
      const video = await Video.findById(req.params.id);

      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }

      const videoPath = video.path;
      
      if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ message: 'Video file not found' });
      }

      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      // Set CORS headers for video streaming
      res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': video.mimeType || 'video/mp4',
          'Cache-Control': 'no-cache',
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': video.mimeType || 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-cache',
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
      }
    } catch (error) {
      res.status(500).json({ message: 'Streaming failed', error: error.message });
    }
  }
);

// Delete video
router.delete('/:id', 
  authenticate, 
  authorize('editor', 'admin'),
  enforceTenantIsolation,
  checkResourceOwnership,
  async (req, res) => {
    try {
      const video = await Video.findById(req.params.id);

      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }

      // Delete file
      if (fs.existsSync(video.path)) {
        fs.unlinkSync(video.path);
      }

      await Video.findByIdAndDelete(req.params.id);

      res.json({ message: 'Video deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Delete failed', error: error.message });
    }
  }
);

export default router;

