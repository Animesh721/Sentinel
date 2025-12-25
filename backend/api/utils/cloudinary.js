import { v2 as cloudinary } from 'cloudinary';

let configured = false;

export function configureCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    configured = true;
  }
  return cloudinary;
}

export async function uploadVideoToCloudinary(buffer, filename) {
  const cloudinary = configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'sentinel-videos',
        public_id: filename,
        chunk_size: 6000000, // 6MB chunks
        eager: [
          { width: 1920, height: 1080, crop: 'limit', quality: 'auto' }
        ],
        eager_async: true,
        notification_url: `${process.env.VERCEL_URL || process.env.FRONTEND_URL}/api/videos/cloudinary-webhook`
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

export async function getVideoMetadata(publicId) {
  const cloudinary = configureCloudinary();
  return await cloudinary.api.resource(publicId, { resource_type: 'video' });
}

export async function deleteVideoFromCloudinary(publicId) {
  const cloudinary = configureCloudinary();
  return await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
}

// Simulate sensitivity analysis
export async function analyzeSensitivity(videoUrl) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  // In production, integrate with services like:
  // - AWS Rekognition
  // - Google Cloud Video Intelligence
  // - Azure Video Indexer
  // - Cloudinary AI Content Moderation

  const random = Math.random();
  return random > 0.2 ? 'safe' : 'flagged';
}
