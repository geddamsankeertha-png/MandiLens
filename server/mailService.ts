/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KisanMandi Secure Email Service (Nodemailer + Optional Gmail SMTP)
 * - Credentials and tokens are never logged in production.
 * - Developer tokens are restricted strictly to non-production environments when SMTP is unconfigured.
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Keep SMTP connections open and reuse them across registration and resend requests.
let pooledTransporter: ReturnType<typeof nodemailer.createTransport> | undefined;
let transporterConfigKey = '';

function getTransporter(): ReturnType<typeof nodemailer.createTransport> {
  const host = process.env.SMTP_HOST!;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASS!;
  const configKey = `${host}:${port}:${user}`;

  if (!pooledTransporter || transporterConfigKey !== configKey) {
    pooledTransporter?.close();
    pooledTransporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      host,
      port,
      secure: port === 465,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      auth: { user, pass },
    });
    transporterConfigKey = configKey;
  }
  return pooledTransporter;
}

export function isSmtpConfigured(): boolean {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return Boolean(host && user && pass);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

export async function sendVerificationEmail(
  toEmail: string,
  verificationToken: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  const isProd = process.env.NODE_ENV === 'production';
  const appBaseUrl = process.env.APP_BASE_URL || (isProd ? '' : 'http://localhost:3000');
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (isProd && (!appBaseUrl || !/^https:\/\//i.test(appBaseUrl))) {
    console.error('[MailService] APP_BASE_URL must be set to the public HTTPS site URL in production.');
    return { success: false, error: 'Email verification URL is not configured correctly.' };
  }
  if (!appBaseUrl) {
    return { success: false, error: 'APP_BASE_URL is not configured.' };
  }

  let verifyUrl: URL;
  try {
    // This app uses client-side tabs rather than URL path routing. Keep the link
    // on the app root so React can open RegisterPage and consume the token.
    verifyUrl = new URL('/', appBaseUrl);
  } catch {
    console.error('[MailService] APP_BASE_URL is not a valid URL.');
    return { success: false, error: 'Email verification URL is not configured correctly.' };
  }
  verifyUrl.searchParams.set('token', verificationToken);
  const verifyLink = verifyUrl.toString();
  const safeName = escapeHtml(userName);

  if (!isSmtpConfigured()) {
    if (isProd) {
      console.error('[MailService] Production error: SMTP is unconfigured. Email delivery cannot be performed.');
      return {
        success: false,
        error: 'Email delivery service is currently unconfigured in production.',
      };
    }

    console.warn('[MailService] SMTP is not configured; verification email was not sent.');
    return {
      success: false,
      error: 'SMTP server is not configured in environment variables. Email delivery is unavailable.',
    };
  }

  try {
    await getTransporter().sendMail({
      from,
      to: toEmail,
      subject: 'Verify your email address for KisanMandi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #15803d; margin-top: 0;">KisanMandi - Mandi Price Predictor</h2>
          <p>Hello <b>${safeName}</b>,</p>
          <p>Thank you for registering with KisanMandi. To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" style="background-color: #15803d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Me</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;"><a href="${verifyLink}">${verifyLink}</a></p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This verification link will expire in 30 minutes. If you did not request this account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">KisanMandi Agricultural Intelligence Platform</p>
        </div>
      `,
      text: `Hello ${userName},\n\nVerify your KisanMandi email address by opening this link: ${verifyLink}\n\nThis link expires in 30 minutes.`,
    });

    return { success: true };
  } catch (err: any) {
    // SMTP error codes are useful for configuration troubleshooting and contain no credentials.
    console.error('[MailService] SMTP delivery failed:', {
      code: err?.code || 'UNKNOWN',
      responseCode: err?.responseCode,
      command: err?.command,
      message: isProd ? undefined : err?.message,
    });
    return { success: false, error: 'Failed to dispatch verification email via SMTP.' };
  }
}
