import express from 'express';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', 
  authenticate, 
  authorize('admin'),
  async (req, res) => {
    try {
      const users = await User.find({ organization: req.user.organization })
        .select('-password')
        .sort({ createdAt: -1 });

      res.json({ users });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
  }
);

// Update user role (admin only)
router.patch('/:id/role', 
  authenticate, 
  authorize('admin'),
  async (req, res) => {
    try {
      const { role } = req.body;
      const { id } = req.params;

      if (!['viewer', 'editor', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const user = await User.findById(id);

      if (!user || user.organization !== req.user.organization) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.role = role;
      await user.save();

      res.json({ 
        message: 'User role updated successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
  }
);

export default router;

