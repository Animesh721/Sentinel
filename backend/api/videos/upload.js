import { connectDB } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadVideoToCloudinary, analyzeSensitivity } from '../utils/cloudinary.js';
import { emitVideoProgress, emitVideoComplete, emitVideoError } from '../utils/pusher.js';
import Video from '../models/Video.js';

// Vercel has a 4.5MB limit for serverless functions body
// We need to handle file uploads differently
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

async function processVideoAsync(videoId, organization) {
  try {
    const video = await Video.findById(videoId);

    if (!video) {
      console.error(`Video ${videoId} not found`);
      return;
    }

    // Update status to processing
    video.status = 'processing';
    video.processingProgress = 10;
    await video.save();

    await emitVideoProgress(organization, {
      videoId: video._id.toString(),
      progress: 10,
      status: 'processing'
    });

    // Cloudinary automatically extracts metadata
    // We can fetch it using the public_id
    video.processingProgress = 50;
    await video.save();

    await emitVideoProgress(organization, {
      videoId: video._id.toString(),
      progress: 50,
      status: 'processing'
    });

    // Analyze sensitivity
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

    // Complete processing
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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Manually apply middleware
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

    // Handle multipart form data
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ message: 'Content-Type must be multipart/form-data' });
    }

    // For Vercel, we recommend using a client-side upload to Cloudinary
    // This is just a webhook receiver or direct buffer upload
    const { buffer, originalName, mimeType, size } = req.body;

    if (!buffer || !originalName) {
      return res.status(400).json({ message: 'File data is required' });
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({ message: 'Invalid file type. Only video files are allowed.' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `video-${timestamp}-${randomSuffix}`;

    // Upload to Cloudinary
    const fileBuffer = Buffer.from(buffer, 'base64');
    const cloudinaryResult = await uploadVideoToCloudinary(fileBuffer, filename);

    // Create video record
    const video = await Video.create({
      filename: cloudinaryResult.public_id,
      originalName,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      size: size || fileBuffer.length,
      mimeType,
      duration: cloudinaryResult.duration || 0,
      status: 'uploading',
      sensitivityStatus: 'pending',
      processingProgress: 0,
      uploadedBy: req.user._id,
      organization: req.user.organization,
      metadata: {
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format
      }
    });

    // Start async processing (don't await)
    processVideoAsync(video._id.toString(), req.user.organization).catch(console.error);

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: video._id,
        filename: video.filename,
        originalName: video.originalName,
        cloudinaryUrl: video.cloudinaryUrl,
        status: video.status,
        processingProgress: video.processingProgress
      }
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ message: 'Video upload failed', error: error.message });
  }
}
