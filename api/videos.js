import { connectDB } from './utils/db.js';
import { authenticate, authorize } from './middleware/auth.js';
import { checkResourceOwnership } from './middleware/multiTenant.js';
import { uploadVideoToCloudinary, analyzeSensitivity, deleteVideoFromCloudinary } from './utils/cloudinary.js';
import { emitVideoProgress, emitVideoComplete, emitVideoError } from './utils/pusher.js';
import Video from './models/Video.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

// Helper to parse request body
async function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return {};
    }
  }
  return {};
}

async function processVideoAsync(videoId, organization) {
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      console.error(`Video ${videoId} not found`);
      return;
    }

    video.status = 'processing';
    video.processingProgress = 10;
    await video.save();

    await emitVideoProgress(organization, {
      videoId: video._id.toString(),
      progress: 10,
      status: 'processing'
    });

    video.processingProgress = 50;
    await video.save();

    await emitVideoProgress(organization, {
      videoId: video._id.toString(),
      progress: 50,
      status: 'processing'
    });

    video.processingProgress = 70;
    await video.save();

    await emitVideoProgress(organization, {
      videoId: video._id.toString(),
      progress: 70,
      status: 'analyzing'
    });

    const sensitivityStatus = await analyzeSensitivity(video.cloudinaryUrl);
    video.sensitivityStatus = sensitivityStatus;
    video.processingProgress = 90;
    await video.save();

    await emitVideoProgress(organization, {
      videoId: video._id.toString(),
      progress: 90,
      status: 'finalizing'
    });

    video.status = 'completed';
    video.processingProgress = 100;
    await video.save();

    await emitVideoComplete(organization, {
      videoId: video._id.toString(),
      status: 'completed',
      sensitivityStatus: video.sensitivityStatus,
      progress: 100
    });

    console.log(`✅ Video ${videoId} processed successfully`);
  } catch (error) {
    console.error(`❌ Error processing video ${videoId}:`, error);

    try {
      const video = await Video.findById(videoId);
      if (video) {
        video.status = 'failed';
        await video.save();

        await emitVideoError(organization, {
          videoId: video._id.toString(),
          status: 'failed',
          error: error.message
        });
      }
    } catch (saveError) {
      console.error('Failed to update video status:', saveError);
    }
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // Extract ID and action from path
  const pathMatch = pathname.match(/\/api\/videos(?:\/([^\/]+)(?:\/([^\/]+))?)?/);
  const videoId = pathMatch?.[1];
  const action = pathMatch?.[2];

  try {
    await connectDB();

    // GET /api/videos - List videos
    if (!videoId && req.method === 'GET') {
      await new Promise((resolve, reject) => {
        authenticate(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const { status, sensitivityStatus, search } = req.query;
      const query = { organization: req.user.organization };

      if (status) query.status = status;
      if (sensitivityStatus) query.sensitivityStatus = sensitivityStatus;
      if (search) query.originalName = { $regex: search, $options: 'i' };

      const videos = await Video.find(query)
        .populate('uploadedBy', 'username email')
        .sort({ createdAt: -1 });

      return res.json({ videos });
    }

    // POST /api/videos/upload-url - Get Cloudinary upload signature for direct upload
    if (videoId === 'upload-url' && req.method === 'POST') {
      await new Promise((resolve, reject) => {
        authenticate(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const authMiddleware = authorize('editor', 'admin');
      await new Promise((resolve, reject) => {
        authMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const body = await parseBody(req);
      const { originalName, mimeType, size } = body;

      if (!originalName) {
        return res.status(400).json({ message: 'File name is required' });
      }

      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
      if (!allowedTypes.includes(mimeType)) {
        return res.status(400).json({ message: 'Invalid file type. Only video files are allowed.' });
      }

      // Create video record in pending state
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const publicId = `sentinel/videos/video-${timestamp}-${randomSuffix}`;

      const video = await Video.create({
        filename: publicId,
        originalName,
        cloudinaryPublicId: publicId,
        size: size || 0,
        mimeType,
        duration: 0,
        status: 'uploading',
        sensitivityStatus: 'pending',
        processingProgress: 0,
        uploadedBy: req.user._id,
        organization: req.user.organization,
        metadata: {}
      });

      // Generate Cloudinary upload parameters
      const cloudinary = (await import('cloudinary')).v2;
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default';

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

      return res.json({
        videoId: video._id,
        uploadUrl,
        uploadPreset,
        publicId,
        cloudName
      });
    }

    // POST /api/videos/:id/upload-complete - Mark upload as complete
    if (action === 'upload-complete' && req.method === 'POST') {
      await new Promise((resolve, reject) => {
        authenticate(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const body = await parseBody(req);
      const { cloudinaryData } = body;

      const video = await Video.findById(videoId);
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }

      // Update video with Cloudinary data
      video.cloudinaryUrl = cloudinaryData.secure_url;
      video.cloudinaryPublicId = cloudinaryData.public_id;
      video.duration = cloudinaryData.duration || 0;
      video.size = cloudinaryData.bytes || video.size;
      video.metadata = {
        width: cloudinaryData.width,
        height: cloudinaryData.height,
        format: cloudinaryData.format
      };
      await video.save();

      // Start processing
      processVideoAsync(video._id.toString(), req.user.organization).catch(console.error);

      return res.json({
        message: 'Upload complete',
        video: {
          id: video._id,
          status: video.status
        }
      });
    }

    // GET /api/videos/:id - Get single video
    if (videoId && !action && req.method === 'GET') {
      await new Promise((resolve, reject) => {
        authenticate(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      req.params = { id: videoId };
      await new Promise((resolve, reject) => {
        checkResourceOwnership(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const video = await Video.findById(videoId).populate('uploadedBy', 'username email');

      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }

      return res.json({ video });
    }

    // GET /api/videos/:id/stream - Stream video
    if (videoId && action === 'stream' && req.method === 'GET') {
      const token = req.query.token || req.headers.authorization?.split(' ')[1];
      if (token) {
        req.headers.authorization = `Bearer ${token}`;
      }

      await new Promise((resolve, reject) => {
        authenticate(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      req.params = { id: videoId };
      await new Promise((resolve, reject) => {
        checkResourceOwnership(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const video = await Video.findById(videoId);

      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }

      if (video.status !== 'completed') {
        return res.status(400).json({ message: 'Video is still processing' });
      }

      return res.redirect(video.cloudinaryUrl);
    }

    // DELETE /api/videos/:id - Delete video
    if (videoId && req.method === 'DELETE') {
      await new Promise((resolve, reject) => {
        authenticate(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const authMiddleware = authorize('editor', 'admin');
      await new Promise((resolve, reject) => {
        authMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      req.params = { id: videoId };
      req.method = 'DELETE';
      await new Promise((resolve, reject) => {
        checkResourceOwnership(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const video = await Video.findById(videoId);

      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }

      try {
        await deleteVideoFromCloudinary(video.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion error:', cloudinaryError);
      }

      await Video.findByIdAndDelete(videoId);

      return res.json({ message: 'Video deleted successfully' });
    }

    res.status(404).json({ message: 'Not found' });
  } catch (error) {
    console.error('Videos API error:', error);
    res.status(500).json({ message: 'Request failed', error: error.message });
  }
}
