import mongoose from 'mongoose';

const UserSessionSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['TikTok', 'Instagram'],
    default: 'TikTok'
  },
  cookies: {
    type: Array,
    required: true,
    default: []
  },
  localStorage: {
    type: Object,
    default: {}
  },
  sessionStorage: {
    type: Object,
    default: {}
  },
  userAgent: {
    type: String,
    default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isValid: {
    type: Boolean,
    default: true
  },
  metadata: {
    loginCount: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Update lastUsed whenever session is accessed
UserSessionSchema.methods.markAsUsed = async function() {
  this.metadata.lastUsed = Date.now();
  await this.save();
};

// Validate session (check if it's not too old)
UserSessionSchema.methods.isSessionValid = function() {
  const daysSinceLastLogin = (Date.now() - this.lastLogin) / (1000 * 60 * 60 * 24);
  return this.isValid && daysSinceLastLogin < 30; // Valid for 30 days
};

export default mongoose.model('UserSession', UserSessionSchema);

