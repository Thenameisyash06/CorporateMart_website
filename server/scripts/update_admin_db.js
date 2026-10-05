const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const usersCol = db.collection('users');

  await usersCol.updateMany(
    { email: { $in: ['Admin@corporate-mart.com', 'admin@corporate-mart.com', 'admin@corporatemart.in'] } },
    {
      $set: {
        email: 'Admin@corporate-mart.com',
        role: 'admin',
        plan: 'pro',
        isSubscribed: true,
        subscriptionExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
        updatedAt: new Date()
      }
    }
  );

  const admin = await usersCol.findOne({ email: 'Admin@corporate-mart.com' });
  console.log('Final Mongo Atlas Admin Document:', {
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    plan: admin.plan,
    isSubscribed: admin.isSubscribed,
    subscriptionExpiresAt: admin.subscriptionExpiresAt
  });

  await mongoose.disconnect();
}

run().catch(console.error);
