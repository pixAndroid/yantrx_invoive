import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

const router = Router();

// POST /api/v1/contact — public endpoint, no auth required
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ success: false, error: 'name, email and message are required' });
      return;
    }

    // Basic email validation — check structure without backtracking risk
    const atIndex = email.indexOf('@');
    if (atIndex < 1 || atIndex >= email.length - 1 || !email.slice(atIndex + 1).includes('.')) {
      res.status(400).json({ success: false, error: 'Invalid email address' });
      return;
    }

    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      undefined;

    const enquiry = await prisma.contactEnquiry.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        subject: subject?.trim() || null,
        message: message.trim(),
        ipAddress,
      },
    });

    res.status(201).json({ success: true, data: { id: enquiry.id } });
  } catch (error) {
    next(error);
  }
});

export default router;
