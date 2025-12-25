import User from './models/User.js';
import { connectDB } from './utils/db.js';
import { authenticate, authorize } from './middleware/auth.js';

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

  // Extract ID from path like /api/users/123/role
  const pathMatch = pathname.match(/\/api\/users(?:\/([^\/]+)(?:\/([^\/]+))?)?/);
  const userId = pathMatch?.[1];
  const action = pathMatch?.[2];

  try {
    await connectDB();

    // Apply authentication middleware
    await new Promise((resolve, reject) => {
      authenticate(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // GET /api/users - List all users (admin only)
    if (!userId && req.method === 'GET') {
      const authMiddleware = authorize('admin');
      await new Promise((resolve, reject) => {
        authMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const users = await User.find({ organization: req.user.organization })
        .select('-password')
        .sort({ createdAt: -1 });

      return res.json({ users });
    }

    // PATCH /api/users/:id/role - Update user role (admin only)
    if (userId && action === 'role' && req.method === 'PATCH') {
      const authMiddleware = authorize('admin');
      await new Promise((resolve, reject) => {
        authMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const body = await parseBody(req);
      const { role } = body;

      if (!['viewer', 'editor', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const user = await User.findById(userId);

      if (!user || user.organization !== req.user.organization) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.role = role;
      await user.save();

      return res.json({
        message: 'User role updated successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    }

    res.status(404).json({ message: 'Not found' });
  } catch (error) {
    console.error('Users API error:', error);
    res.status(500).json({ message: 'Request failed', error: error.message });
  }
}
