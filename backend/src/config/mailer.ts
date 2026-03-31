import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Dev: Use Ethereal (fake SMTP)
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
};

export const transporter = createTransporter();

export const verifyMailer = async () => {
  try {
    await transporter.verify();
    logger.info('✅ Mailer ready');
  } catch (err) {
    logger.warn('⚠️  Mailer not configured:', (err as Error).message);
  }
};
