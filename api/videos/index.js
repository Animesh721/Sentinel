import { connectDB } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';
import Video from '../models/Video.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    const { status, sensitivityStatus, search } = req.query;

    // Build query
    const query = { organization: req.user.organization };

    if (status) {
      query.status = status;
    }

    if (sensitivityStatus) {
      query.sensitivityStatus = sensitivityStatus;
    }

    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    const videos = await Video.find(query)
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({ videos });
  } catch (error) {
    console.error('Fetch videos error:', error);
    res.status(500).json({ message: 'Failed to fetch videos', error: error.message });
  }
}
