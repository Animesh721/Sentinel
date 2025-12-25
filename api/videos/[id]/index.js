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
    const video = await Video.findById(id).populate('uploadedBy', 'username email');

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json({ video });
  } catch (error) {
    console.error('Fetch video error:', error);
    res.status(500).json({ message: 'Failed to fetch video', error: error.message });
  }
}
