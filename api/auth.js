import jwt from 'jsonwebtoken';
import User from './models/User.js';
import { connectDB } from './utils/db.js';
import { authenticate } from './middleware/auth.js';

// Helper to parse request body
async function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  // For serverless functions, body might be a string
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
  const route = pathname.replace('/api/auth', '');

  console.log('Auth API called:', { method: req.method, pathname, route });

  // LOGIN
  if (route === '/login' && req.method === 'POST') {
    try {
      await connectDB();
      const body = await parseBody(req);
      const { email, password } = body;

      console.log('Login attempt:', { email, hasPassword: !!password, bodyType: typeof req.body });

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await User.findOne({ email });
      console.log('User found:', !!user);

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await user.comparePassword(password);
      console.log('Password valid:', isPasswordValid);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          organization: user.organization
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
    return;
  }

  // REGISTER
  if (route === '/register' && req.method === 'POST') {
    try {
      await connectDB();
      const body = await parseBody(req);
      const { username, email, password, organization } = body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
      }

      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await User.create({
        username,
        email,
        password,
        organization: organization || 'default',
        role: 'viewer'
      });

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          organization: user.organization
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed', error: error.message });
    }
    return;
  }

  // ME (Get current user)
  if (route === '/me' && req.method === 'GET') {
    try {
      await connectDB();

      // Apply authentication middleware
      await new Promise((resolve, reject) => {
        authenticate(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const user = await User.findById(req.user.id).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          organization: user.organization
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user', error: error.message });
    }
    return;
  }

  res.status(404).json({ message: 'Not found' });
}
