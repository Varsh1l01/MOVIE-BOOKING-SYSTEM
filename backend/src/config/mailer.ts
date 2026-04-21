import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export const createTransporter = () => {
  // Uses env vars in all environments (dev + prod)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // false = STARTTLS on port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const transporter = createTransporter();

export const verifyMailer = async () => {
  try {
    await transporter.verify();
    logger.info(`✅ Mailer ready — sending from: ${process.env.SMTP_USER}`);
  } catch (err) {
    logger.warn('⚠️  Mailer not configured correctly:', (err as Error).message);
  }
};
