import { transporter } from '../../config/mailer';
import { logger } from '../../utils/logger';

const FROM = process.env.EMAIL_FROM || '"MovieBook" <rathodvarshil9@gmail.com>';

// ─── OTP Email ────────────────────────────────────────────────────────────────
export const sendOtpEmail = async (email: string, name: string, otp: string, purpose: string): Promise<void> => {
  // Always log OTP to console in dev — safety net if email fails
  if (process.env.NODE_ENV !== 'production') {
    logger.info('');
    logger.info('┌─────────────────────────────────────────┐');
    logger.info(`│  OTP  ▸  ${otp}  (${purpose})`);
    logger.info(`│  To   ▸  ${email}`);
    logger.info('└─────────────────────────────────────────┘');
    logger.info('');
  }

  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `Your OTP — ${purpose}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif">
          <div style="max-width:480px;margin:40px auto;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#e50914,#b00610);padding:32px;text-align:center">
              <div style="font-size:32px;margin-bottom:8px">🎬</div>
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px">MovieBook</h1>
            </div>
            <!-- Body -->
            <div style="padding:32px">
              <h2 style="color:#f1f1f1;margin:0 0 8px;font-size:20px">Hello, ${name}! 👋</h2>
              <p style="color:#888;margin:0 0 28px;font-size:14px;line-height:1.6">
                Here is your one-time password for <strong style="color:#bbb">${purpose}</strong>.
                It expires in <strong style="color:#bbb">10 minutes</strong>.
              </p>
              <!-- OTP box -->
              <div style="background:#111;border:2px solid #e50914;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
                <div style="font-size:42px;font-weight:800;letter-spacing:14px;color:#e50914;font-family:monospace">${otp}</div>
              </div>
              <p style="color:#555;font-size:12px;margin:0;line-height:1.6">
                🔒 Never share this code with anyone.
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
            <!-- Footer -->
            <div style="padding:20px 32px;border-top:1px solid #2a2a2a;text-align:center">
              <p style="color:#444;font-size:12px;margin:0">© 2025 MovieBook · All rights reserved</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    logger.info(`📧 OTP email sent to ${email}`);
  } catch (err) {
    logger.warn('⚠️  Email delivery failed. OTP is printed above in logs.', (err as Error).message);
  }
};

// ─── Welcome Email ────────────────────────────────────────────────────────────
export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: '🎬 Welcome to MovieBook!',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif">
          <div style="max-width:480px;margin:40px auto;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a">
            <div style="background:linear-gradient(135deg,#e50914,#b00610);padding:32px;text-align:center">
              <div style="font-size:32px;margin-bottom:8px">🎬</div>
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">MovieBook</h1>
            </div>
            <div style="padding:32px">
              <h2 style="color:#f1f1f1;margin:0 0 12px;font-size:22px">Welcome aboard, ${name}! 🎉</h2>
              <p style="color:#888;font-size:14px;line-height:1.8;margin:0 0 24px">
                Your account has been created. You can now browse movies,
                choose your seats, and book tickets in seconds.
              </p>
              <div style="text-align:center">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}"
                  style="display:inline-block;background:#e50914;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px">
                  Start Exploring →
                </a>
              </div>
            </div>
            <div style="padding:20px 32px;border-top:1px solid #2a2a2a;text-align:center">
              <p style="color:#444;font-size:12px;margin:0">© 2025 MovieBook · All rights reserved</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (err) {
    logger.warn('Failed to send welcome email:', (err as Error).message);
  }
};

// ─── Password Reset Email ─────────────────────────────────────────────────────
export const sendPasswordResetEmail = async (email: string, name: string, otp: string): Promise<void> => {
  // Log to console in dev
  if (process.env.NODE_ENV !== 'production') {
    logger.info('');
    logger.info('┌─────────────────────────────────────────┐');
    logger.info(`│  PASSWORD RESET OTP  ▸  ${otp}`);
    logger.info(`│  To  ▸  ${email}`);
    logger.info('└─────────────────────────────────────────┘');
    logger.info('');
  }

  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: '🔑 Password Reset OTP — MovieBook',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif">
          <div style="max-width:480px;margin:40px auto;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a">
            <div style="background:linear-gradient(135deg,#e50914,#b00610);padding:32px;text-align:center">
              <div style="font-size:32px;margin-bottom:8px">🔑</div>
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">Password Reset</h1>
            </div>
            <div style="padding:32px">
              <h2 style="color:#f1f1f1;margin:0 0 8px;font-size:20px">Hello, ${name}</h2>
              <p style="color:#888;margin:0 0 28px;font-size:14px;line-height:1.6">
                Use this OTP to reset your password. Expires in <strong style="color:#bbb">10 minutes</strong>.
              </p>
              <div style="background:#111;border:2px solid #e50914;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
                <div style="font-size:42px;font-weight:800;letter-spacing:14px;color:#e50914;font-family:monospace">${otp}</div>
              </div>
              <p style="color:#555;font-size:12px;margin:0;line-height:1.6">
                ⚠️ If you did not request a password reset, please secure your account immediately.
              </p>
            </div>
            <div style="padding:20px 32px;border-top:1px solid #2a2a2a;text-align:center">
              <p style="color:#444;font-size:12px;margin:0">© 2025 MovieBook · All rights reserved</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    logger.info(`📧 Password reset email sent to ${email}`);
  } catch (err) {
    logger.warn('Failed to send reset email:', (err as Error).message);
  }
};

// ─── Booking Confirmation Email ───────────────────────────────────────────────
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
      subject: `🎟️ Booking Confirmed — ${booking.bookingRef}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif">
          <div style="max-width:480px;margin:40px auto;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a">
            <div style="background:linear-gradient(135deg,#e50914,#b00610);padding:32px;text-align:center">
              <div style="font-size:32px;margin-bottom:8px">🎟️</div>
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">Booking Confirmed!</h1>
            </div>
            <div style="padding:32px">
              <p style="color:#888;font-size:14px;margin:0 0 20px">Dear ${name}, your booking is confirmed. Enjoy the show! 🍿</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="padding:10px;border-bottom:1px solid #2a2a2a;color:#666">Booking Ref</td><td style="padding:10px;border-bottom:1px solid #2a2a2a;color:#f1f1f1;font-weight:600">${booking.bookingRef}</td></tr>
                <tr><td style="padding:10px;border-bottom:1px solid #2a2a2a;color:#666">Movie</td><td style="padding:10px;border-bottom:1px solid #2a2a2a;color:#f1f1f1">${booking.movieTitle}</td></tr>
                <tr><td style="padding:10px;border-bottom:1px solid #2a2a2a;color:#666">Theatre</td><td style="padding:10px;border-bottom:1px solid #2a2a2a;color:#f1f1f1">${booking.theatreName}</td></tr>
                <tr><td style="padding:10px;border-bottom:1px solid #2a2a2a;color:#666">Show Time</td><td style="padding:10px;border-bottom:1px solid #2a2a2a;color:#f1f1f1">${booking.showTime}</td></tr>
                <tr><td style="padding:10px;border-bottom:1px solid #2a2a2a;color:#666">Seats</td><td style="padding:10px;border-bottom:1px solid #2a2a2a;color:#f1f1f1">${booking.seats.join(', ')}</td></tr>
                <tr><td style="padding:10px;color:#666">Total Paid</td><td style="padding:10px;color:#e50914;font-weight:700;font-size:16px">₹${booking.totalAmount}</td></tr>
              </table>
            </div>
            <div style="padding:20px 32px;border-top:1px solid #2a2a2a;text-align:center">
              <p style="color:#444;font-size:12px;margin:0">© 2025 MovieBook · All rights reserved</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (err) {
    logger.warn('Failed to send booking confirmation email:', (err as Error).message);
  }
};
