import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  cloudinaryUrl: {
    type: String,
    required: false
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'completed', 'failed'],
    default: 'uploading'
  },
  sensitivityStatus: {
    type: String,
    enum: ['safe', 'flagged', 'pending'],
    default: 'pending'
  },
  processingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: String,
    required: true
  },
  metadata: {
    width: Number,
    height: Number,
    bitrate: Number,
    codec: String,
    format: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before saving
videoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
videoSchema.index({ uploadedBy: 1, organization: 1 });
videoSchema.index({ status: 1, sensitivityStatus: 1 });

// Clear cached model to force schema update in serverless environment
if (mongoose.models.Video) {
  delete mongoose.models.Video;
}

export default mongoose.model('Video', videoSchema);
