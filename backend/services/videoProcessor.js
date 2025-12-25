import ffmpeg from 'fluent-ffmpeg';
import Video from '../models/Video.js';
import path from 'path';
import fs from 'fs';

let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

// Simulate sensitivity analysis
// In production, this would use ML models or content moderation APIs
const analyzeSensitivity = async (videoPath) => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // For demo: randomly classify as safe or flagged
  // In production, use actual content analysis
  const random = Math.random();
  return random > 0.2 ? 'safe' : 'flagged'; // 80% safe, 20% flagged
};

export const processVideo = async (videoId, organization) => {
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

    // Emit progress update
    if (ioInstance) {
      ioInstance.to(organization).emit('video:progress', {
        videoId: video._id.toString(),
        progress: 10,
        status: 'processing'
      });
    }

    // Get video metadata
    await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(video.path, (err, metadata) => {
        if (err) {
          console.error('FFprobe error:', err);
          // Continue without metadata
          resolve();
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (videoStream) {
          video.metadata = {
            width: videoStream.width,
            height: videoStream.height,
            bitrate: videoStream.bit_rate,
            codec: videoStream.codec_name
          };
          video.duration = Math.floor(metadata.format.duration || 0);
        }
        resolve();
      });
    });

    video.processingProgress = 50;
    await video.save();

    if (ioInstance) {
      ioInstance.to(organization).emit('video:progress', {
        videoId: video._id.toString(),
        progress: 50,
        status: 'processing'
      });
    }

    // Analyze sensitivity
    video.processingProgress = 70;
    await video.save();

    if (ioInstance) {
      ioInstance.to(organization).emit('video:progress', {
        videoId: video._id.toString(),
        progress: 70,
        status: 'analyzing'
      });
    }

    const sensitivityStatus = await analyzeSensitivity(video.path);
    video.sensitivityStatus = sensitivityStatus;
    video.processingProgress = 90;
    await video.save();

    if (ioInstance) {
      ioInstance.to(organization).emit('video:progress', {
        videoId: video._id.toString(),
        progress: 90,
        status: 'finalizing'
      });
    }

    // Complete processing
    video.status = 'completed';
    video.processingProgress = 100;
    await video.save();

    // Emit completion
    if (ioInstance) {
      ioInstance.to(organization).emit('video:complete', {
        videoId: video._id.toString(),
        status: 'completed',
        sensitivityStatus: video.sensitivityStatus,
        progress: 100
      });
    }

    console.log(`✅ Video ${videoId} processed successfully`);
  } catch (error) {
    console.error(`❌ Error processing video ${videoId}:`, error);
    
    try {
      const video = await Video.findById(videoId);
      if (video) {
        video.status = 'failed';
        await video.save();

        if (ioInstance) {
          ioInstance.to(organization).emit('video:error', {
            videoId: video._id.toString(),
            status: 'failed',
            error: error.message
          });
        }
      }
    } catch (saveError) {
      console.error('Failed to update video status:', saveError);
    }
  }
};

