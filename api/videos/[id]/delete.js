import { connectDB } from '../../utils/db.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { checkResourceOwnership } from '../../middleware/multiTenant.js';
import { deleteVideoFromCloudinary } from '../../utils/cloudinary.js';
import Video from '../../models/Video.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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

    req.params = { id: req.query.id };
    req.method = 'DELETE';
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

    // Delete from Cloudinary
    try {
      await deleteVideoFromCloudinary(video.cloudinaryPublicId);
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion error:', cloudinaryError);
      // Continue with DB deletion even if Cloudinary fails
    }

    // Delete from database
    await Video.findByIdAndDelete(id);

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Failed to delete video', error: error.message });
  }
}
