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
  passwordLastChanged: {
    type: Date,
    default: Date.now
  },
  requirePasswordChange: {
    type: Boolean,
    default: false
  },
  previousPasswords: [{
    password: String,
    changedAt: Date
  }],
  subUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  securityLog: [{
    action: {
      type: String,
      enum: ['login', 'logout', 'password_change', 'failed_login', 'password_reset', 'account_locked', 'account_unlocked']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    status: {
      type: String,
      enum: ['success', 'failure']
    },
    details: mongoose.Schema.Types.Mixed
  }],
  accountLockout: {
    isLocked: {
      type: Boolean,
      default: false
    },
    lockedAt: Date,
    lockedReason: String,
    unlockAt: Date
  },
  lastSuccessfulLogin: {
    timestamp: Date,
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String
    }
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
  profilePicture: {
    type: String,
    default: null
  },
  // UI-specific permissions
  permissions: {
    virtual: {
      type: Boolean,
      default: false
    },
    personal: {
      type: Boolean,
      default: false
    },
    internationalPersonal: {
      type: Boolean,
      default: false
    },
    internationalVirtual: {
      type: Boolean,
      default: false
    }
  },
  // Role-based permissions with defaults
  rolePermissions: {
    canCreateUsers: {
      type: Boolean,
      default: false
    },
    canUpdateUsers: {
      type: Boolean,
      default: false
    },
    canDeleteUsers: {
      type: Boolean,
      default: false
    },
    canViewAllUsers: {
      type: Boolean,
      default: false
    },
    canManageAdmins: {
      type: Boolean,
      default: false
    },
    canManageResellers: {
      type: Boolean,
      default: false
    },
    canManageUsers: {
      type: Boolean,
      default: false
    },
    canViewAnalytics: {
      type: Boolean,
      default: false
    },
    canManageSettings: {
      type: Boolean,
      default: false
    },
    canManagePricingPlans: {
      type: Boolean,
      default: false
    },
    canViewSystemStats: {
      type: Boolean,
      default: false
    },
    canManageAllCampaigns: {
      type: Boolean,
      default: false
    },
    canManageAllReports: {
      type: Boolean,
      default: false
    },
    canManageAllGroups: {
      type: Boolean,
      default: false
    },
    canManageAllTemplates: {
      type: Boolean,
      default: false
    },
    canManageAllCredits: {
      type: Boolean,
      default: false
    },
    canManageAllAPIKeys: {
      type: Boolean,
      default: false
    },
    hasUnlimitedCredits: {
      type: Boolean,
      default: false
    }
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
  }],
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedReason: {
    type: String
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lastLoginAttempt: {
    type: Date
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      whatsapp: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  auditLog: [{
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Remove these lines to avoid duplicate index warnings
// userSchema.index({ username: 1 }, { unique: true });
// userSchema.index({ email: 1 }, { unique: true, sparse: true });

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

// Add method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('Comparing passwords...');
  console.log('Candidate password:', candidatePassword);
  console.log('Stored password hash:', this.password);
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  console.log('Password match result:', isMatch);
  return isMatch;
};

// Method to add new session
userSchema.methods.addSession = async function(sessionData) {
  this.sessions.push(sessionData);
  return await this.save();
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
