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

export function isSmtpConfigured(): boolean {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return Boolean(host && user && pass);
}

export async function sendVerificationEmail(
  toEmail: string,
  verificationToken: string,
  userName: string
): Promise<{ success: boolean; error?: string; devToken?: string }> {
  const isProd = process.env.NODE_ENV === 'production';
  const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  const verifyLink = `${appBaseUrl}/verify-email?token=${verificationToken}`;
  const from = process.env.SMTP_FROM || 'KisanMandi Support <noreply@kisanmandi.local>';

  if (!isSmtpConfigured()) {
    if (isProd) {
      console.error('[MailService] Production error: SMTP is unconfigured. Email delivery cannot be performed.');
      return {
        success: false,
        error: 'Email delivery service is currently unconfigured in production.',
      };
    }

    // Non-production development / test fallback only
    console.warn(`[MailService] SMTP unconfigured. Verification token for ${toEmail}: [REDACTED FOR SECURITY] (Dev Link: ${verifyLink})`);
    return {
      success: false,
      error: 'SMTP server is not configured in environment variables. Email delivery is unavailable.',
      devToken: verificationToken,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from,
      to: toEmail,
      subject: 'Verify your email address for KisanMandi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #15803d; margin-top: 0;">KisanMandi - Mandi Price Predictor</h2>
          <p>Hello <b>${userName}</b>,</p>
          <p>Thank you for registering with KisanMandi. To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" style="background-color: #15803d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;"><a href="${verifyLink}">${verifyLink}</a></p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This verification link will expire in 30 minutes. If you did not request this account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">KisanMandi Agricultural Intelligence Platform</p>
        </div>
      `,
    });

    return { success: true };
  } catch (err: any) {
    console.error('[MailService] Failed to send email via SMTP:', isProd ? '[Redacted Error]' : err?.message);
    return { success: false, error: 'Failed to dispatch verification email via SMTP.' };
  }
}
