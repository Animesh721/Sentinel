import { connectDB } from '../../utils/db.js';
import { authenticate } from '../../middleware/auth.js';
import { checkResourceOwnership } from '../../middleware/multiTenant.js';
import Video from '../../models/Video.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Check for token in query params (for video element src)
    const token = req.query.token || req.headers.authorization?.split(' ')[1];
    if (token) {
      req.headers.authorization = `Bearer ${token}`;
    }

    // Manually apply middleware
    await new Promise((resolve, reject) => {
      authenticate(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    req.params = { id: req.query.id };
    await new Promise((resolve, reject) => {
      checkResourceOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const { id } = req.query;
    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (video.status !== 'completed') {
      return res.status(400).json({ message: 'Video is still processing' });
    }

    // For Cloudinary-hosted videos, redirect to the Cloudinary URL
    // Cloudinary handles streaming, range requests, and adaptive bitrate automatically
    res.redirect(video.cloudinaryUrl);
  } catch (error) {
    console.error('Stream video error:', error);
    res.status(500).json({ message: 'Failed to stream video', error: error.message });
  }
}
