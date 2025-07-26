const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/whatsapp_bulk_campaign';

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  isSuperAdmin: Boolean,
  email: String,
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema, 'users');

async function resetSuperAdminPassword() {
  await mongoose.connect(MONGODB_URI);
  const username = 'superadmin1';
  const password = 'SuperAdmin@123';

  const user = await User.findOne({ username });
  if (!user) {
    console.log('superadmin1 user not found.');
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);
  user.password = hashed;
  user.updatedAt = new Date();
  await user.save();
  console.log('superadmin1 password has been reset successfully.');
  process.exit(0);
}

resetSuperAdminPassword().catch(err => {
  console.error('Error resetting password:', err);
  process.exit(1);
});
