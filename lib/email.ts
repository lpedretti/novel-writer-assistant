/**
 * Email utility for sending transactional emails
 *
 * NOTE: This is a development implementation that logs to console.
 * In production, integrate with a service like:
 * - SendGrid
 * - AWS SES
 * - Resend
 * - Postmark
 */

const BASE_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<void> {
  // In production, replace this with actual email service
  console.log('\n====== EMAIL NOTIFICATION ======');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`\nText Content:\n${text}`);
  console.log(`\nHTML Content:\n${html}`);
  console.log('================================\n');

  // Simulate email delay
  await new Promise(resolve => setTimeout(resolve, 100));
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${BASE_URL}/auth/verify-email?token=${token}`;

  const subject = 'Verify your email - Reverie Capsule';
  const text = `
Welcome to Reverie Capsule!

Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb, #60a5fa); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Reverie Capsule!</h1>
    </div>
    <div class="content">
      <p>Thank you for creating an account. Please verify your email address to get started.</p>
      <p style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </p>
      <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
    </div>
    <div class="footer">
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({ to: email, subject, text, html });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}`;

  const subject = 'Reset your password - Reverie Capsule';
  const text = `
Password Reset Request

We received a request to reset your password for your Reverie Capsule account.

Click the link below to reset your password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb, #60a5fa); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>We received a request to reset your password for your Reverie Capsule account.</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>
      <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
      <div class="warning">
        <strong>Security Notice:</strong> This link will expire in 1 hour for your security.
      </div>
      <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
    </div>
    <div class="footer">
      <p>For security reasons, never share this link with anyone.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({ to: email, subject, text, html });
}
