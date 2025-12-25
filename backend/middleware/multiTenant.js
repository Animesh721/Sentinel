// Multi-tenant middleware to ensure users only access their organization's data
export const enforceTenantIsolation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Add organization filter to request
  req.organization = req.user.organization;
  next();
};

// Middleware to check if user owns the resource or is admin
export const checkResourceOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Video = (await import('../models/Video.js')).default;
    
    const video = await Video.findById(id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // All users in the same organization can view videos
    if (video.organization === req.user.organization) {
      // For write operations (delete), check ownership or admin role
      if (req.method === 'DELETE' && req.user.role !== 'admin') {
        if (video.uploadedBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'Access denied. You can only delete your own videos.' });
        }
      }
      return next();
    }

    // Users cannot access videos from other organizations
    return res.status(403).json({ message: 'Access denied' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

