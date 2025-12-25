import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createTestUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video-app');
    console.log('✅ Connected to MongoDB\n');

    const testUsers = [
      {
        username: 'admin',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin',
        organization: 'default'
      },
      {
        username: 'editor',
        email: 'editor@test.com',
        password: 'editor123',
        role: 'editor',
        organization: 'default'
      },
      {
        username: 'viewer',
        email: 'viewer@test.com',
        password: 'viewer123',
        role: 'viewer',
        organization: 'default'
      }
    ];

    console.log('Creating test users...\n');

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ 
        $or: [{ email: userData.email }, { username: userData.username }] 
      });

      if (existingUser) {
        console.log(`⚠️  User ${userData.username} already exists, skipping...`);
      } else {
        const user = await User.create(userData);
        console.log(`✅ Created user: ${user.username} (${user.email}) - Role: ${user.role}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\nTest Users Created:');
    console.log('='.repeat(80));
    console.log('\nAdmin User:');
    console.log('  Email: admin@test.com');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    console.log('\nEditor User:');
    console.log('  Email: editor@test.com');
    console.log('  Password: editor123');
    console.log('  Role: editor');
    console.log('\nViewer User:');
    console.log('  Email: viewer@test.com');
    console.log('  Password: viewer123');
    console.log('  Role: viewer');
    console.log('\n' + '='.repeat(80));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createTestUsers();

