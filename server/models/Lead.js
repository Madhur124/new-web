import mongoose from 'mongoose';
import crypto from 'crypto';

const leadSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: 150,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    company: { type: String, trim: true, maxlength: 150, default: '' },
    service: { type: String, required: [true, 'Service is required'], trim: true, maxlength: 150 },
    timeline: { type: String, trim: true, maxlength: 100, default: '' },
    message: { type: String, required: [true, 'Message is required'], trim: true, maxlength: 3000 },
  },
  { timestamps: true }
);

// Auto-generate a readable lead code like PC-8F3A2C
leadSchema.pre('validate', function (next) {
  if (!this.code) this.code = 'PC-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  next();
});

// Match the frontend's LeadRecord interface
leadSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.timestamp = ret.createdAt;
    delete ret._id;
    delete ret.__v;
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  },
});

export default mongoose.model('Lead', leadSchema);