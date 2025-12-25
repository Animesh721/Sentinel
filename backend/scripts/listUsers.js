import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video-app');
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({}).select('-password');
    
    console.log(`Found ${users.length} user(s):\n`);
    console.log('='.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Organization: ${user.organization}`);
      console.log(`  Created: ${user.createdAt}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\nNote: Passwords are hashed and cannot be retrieved.');
    console.log('To login, use the email address shown above.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

listUsers();

