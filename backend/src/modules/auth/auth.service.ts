import { transporter } from '../../config/mailer';
import { logger } from '../../utils/logger';

const FROM = process.env.EMAIL_FROM || '"Movie Booking" <noreply@moviebooking.com>';

export const sendOtpEmail = async (email: string, name: string, otp: string, purpose: string): Promise<void> => {
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `Your OTP for ${purpose}`,
      html: `
        <h2>Hello ${name},</h2>
        <p>Your one-time password for <strong>${purpose}</strong> is:</p>
        <div style="font-size:2rem;font-weight:bold;color:#e50914;letter-spacing:8px;margin:20px 0">${otp}</div>
        <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br><p>— Movie Booking Team</p>
      `,
    });
  } catch (err) {
    logger.warn('Failed to send OTP email:', err);
  }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: '🎬 Welcome to Movie Booking!',
      html: `
        <h2>Welcome, ${name}! 🎉</h2>
        <p>Thank you for joining Movie Booking. Enjoy seamless movie ticket booking!</p>
        <p>Explore now and book your first ticket today.</p>
        <br><p>— Movie Booking Team</p>
      `,
    });
  } catch (err) {
    logger.warn('Failed to send welcome email:', err);
  }
};

export const sendPasswordResetEmail = async (email: string, name: string, otp: string): Promise<void> => {
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <h2>Hello ${name},</h2>
        <p>Your password reset OTP is:</p>
        <div style="font-size:2rem;font-weight:bold;color:#e50914;letter-spacing:8px;margin:20px 0">${otp}</div>
        <p>Valid for <strong>10 minutes</strong>. If you did not request this, secure your account immediately.</p>
        <br><p>— Movie Booking Team</p>
      `,
    });
  } catch (err) {
    logger.warn('Failed to send reset email:', err);
  }
};

export const sendBookingConfirmationEmail = async (
  email: string,
  name: string,
  booking: {
    bookingRef: string;
    movieTitle: string;
    theatreName: string;
    showTime: string;
    seats: string[];
    totalAmount: number;
  }
): Promise<void> => {
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `Booking Confirmed - ${booking.bookingRef}`,
      html: `
        <h2>🎬 Booking Confirmed!</h2>
        <p>Dear ${name}, your booking is confirmed.</p>
        <table style="border-collapse:collapse;width:100%;max-width:500px">
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Booking Ref</strong></td><td style="padding:8px;border:1px solid #ddd">${booking.bookingRef}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Movie</strong></td><td style="padding:8px;border:1px solid #ddd">${booking.movieTitle}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Theatre</strong></td><td style="padding:8px;border:1px solid #ddd">${booking.theatreName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Show Time</strong></td><td style="padding:8px;border:1px solid #ddd">${booking.showTime}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Seats</strong></td><td style="padding:8px;border:1px solid #ddd">${booking.seats.join(', ')}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Total</strong></td><td style="padding:8px;border:1px solid #ddd">₹${booking.totalAmount}</td></tr>
        </table>
        <br><p>Enjoy your movie! 🍿</p>
        <p>— Movie Booking Team</p>
      `,
    });
  } catch (err) {
    logger.warn('Failed to send booking confirmation email:', err);
  }
};
