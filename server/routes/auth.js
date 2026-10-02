import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

// ---------- Middleware: protects admin routes ----------
export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('Not admin');
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

// ---------- Route: POST /api/auth/login ----------
const router = express.Router();

// Max 10 PIN attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again later.' },
});

const sha256 = (v) => crypto.createHash('sha256').update(String(v)).digest();

router.post('/login', loginLimiter, (req, res) => {
  const pin = String(req.body?.pin || '').trim();
  const expected = process.env.ADMIN_PIN;
  if (!expected) return res.status(500).json({ message: 'Server not configured' });

  const ok = crypto.timingSafeEqual(sha256(pin), sha256(expected));
  if (!ok) return res.status(401).json({ message: 'Incorrect PIN. Access denied.' });

  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

export default router;