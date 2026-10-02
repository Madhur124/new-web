import express from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import Lead from '../models/Lead.js';
import { requireAdmin } from '../auth.js';

const router = express.Router();

// Max 10 form submissions per hour per IP (spam protection)
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many submissions. Please try again later.' },
});

// PUBLIC: POST /api/leads  (contact form)
router.post('/', submitLimiter, async (req, res) => {
  try {
    const { name, email, company, service, timeline, message, website } = req.body || {};

    // Honeypot: hidden input named "website" in the form; bots fill it, humans don't
    if (website) return res.status(201).json({ success: true });

    const lead = await Lead.create({ name, email, company, service, timeline, message });
    res.status(201).json({ success: true, code: lead.code });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: errors[0], errors });
    }
    console.error('Create lead failed:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ADMIN: GET /api/leads (newest first)
router.get('/', requireAdmin, async (_req, res) => {
  try {
    res.json(await Lead.find().sort({ createdAt: -1 }));
  } catch (err) {
    console.error('Fetch leads failed:', err);
    res.status(500).json({ message: 'Could not load leads' });
  }
});

// ADMIN: DELETE /api/leads (delete all)
router.delete('/', requireAdmin, async (_req, res) => {
  try {
    const result = await Lead.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    console.error('Delete all failed:', err);
    res.status(500).json({ message: 'Could not delete leads' });
  }
});

// ADMIN: DELETE /api/leads/:id (delete one)
router.delete('/:id', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete lead failed:', err);
    res.status(500).json({ message: 'Could not delete lead' });
  }
});

export default router;