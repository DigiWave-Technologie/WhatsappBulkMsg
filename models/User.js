const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Remove any existing indexes
mongoose.connection.once('open', async () => {
  try {
    await mongoose.connection.db.collection('users').dropIndex('userName_1');
    console.log('Dropped userName index');
  } catch (error) {
    // Index might not exist, which is fine
    console.log('No userName index to drop');
  }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: false,
    trim: true
  },
  lastName: {
    type: String,
    required: false,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: false,
    trim: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'reseller', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  loginHistory: [{
    timestamp: Date,
    ipAddress: String,
    deviceInfo: {
      deviceType: String,
      browser: String,
      os: String
    }
  }],
  canCreateUsers: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.role !== 'super_admin';
    }
  },
  sessions: [{
    token: String,
    deviceInfo: {
      deviceType: String,
      browser: String,
      os: String,
      ip: String
    },
    loginAt: {
      type: Date,
      default: Date.now
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  // New fields for API integration
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
  apiKeyCreatedAt: {
    type: Date
  },
  apiKeyLastUsed: {
    type: Date
  },
  // New fields for white-label branding
  branding: {
    logo: String,
    primaryColor: String,
    secondaryColor: String,
    companyName: String
  },
  // New fields for WhatsApp integration
  whatsappNumbers: [{
    number: String,
    isVerified: Boolean,
    isActive: Boolean,
    lastUsed: Date
  }],
  // New fields for message limits
  messageLimits: {
    daily: Number,
    monthly: Number,
    total: Number
  },
  // New fields for sender IDs
  senderIds: [{
    id: String,
    isActive: Boolean,
    lastUsed: Date
  }]
}, {
  timestamps: true
});

// Create indexes (removed duplicate declarations)
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to add new session
userSchema.methods.addSession = function(sessionData) {
  this.sessions.push(sessionData);
  return this.save();
};

// Method to remove session
userSchema.methods.removeSession = function(token) {
  this.sessions = this.sessions.filter(session => session.token !== token);
  return this.save();
};

// Method to update session activity
userSchema.methods.updateSessionActivity = function(token) {
  const session = this.sessions.find(s => s.token === token);
  if (session) {
    session.lastActive = new Date();
    return this.save();
  }
  return Promise.resolve();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
