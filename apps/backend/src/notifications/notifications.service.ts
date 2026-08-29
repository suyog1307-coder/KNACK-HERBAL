import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SmsOptions {
  to: string;   // E.164 format e.g. +919876543210
  message: string;
}

export interface WhatsAppOptions {
  to: string;
  message: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Email ────────────────────────────────────────────────────────────────
  /**
   * Send an email via nodemailer.
   * Install: pnpm add nodemailer @types/nodemailer
   * Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
   */
  async sendEmail(opts: EmailOptions): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.warn(`[Email] SMTP not configured — skipping email to ${opts.to}`);
      this.logger.debug(`[Email DEV] To: ${opts.to} | Subject: ${opts.subject}`);
      return;
    }

    try {
      // Dynamic import so the app boots even without nodemailer installed
      const nodemailer = await import('nodemailer').catch(() => null);
      if (!nodemailer) {
        this.logger.warn('[Email] nodemailer not installed. Run: pnpm add nodemailer @types/nodemailer');
        return;
      }

      const transporter = nodemailer.default.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT') ?? 587,
        secure: false,
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });

      await transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM') ?? 'noreply@knackherbal.com',
        ...opts,
      });

      this.logger.log(`[Email] Sent to ${opts.to} — ${opts.subject}`);
    } catch (err) {
      this.logger.error(`[Email] Failed to send to ${opts.to}`, err);
    }
  }

  // ─── SMS ──────────────────────────────────────────────────────────────────
  /**
   * Send SMS via Twilio.
   * Install: pnpm add twilio
   * Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM
   */
  async sendSms(opts: SmsOptions): Promise<void> {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    if (!sid) {
      this.logger.warn(`[SMS] Twilio not configured — skipping SMS to ${opts.to}`);
      this.logger.debug(`[SMS DEV] To: ${opts.to} | Message: ${opts.message}`);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = (() => { try { return require('twilio'); } catch { return null; } })();
      if (!twilio) {
        this.logger.warn('[SMS] twilio not installed. Run: pnpm add twilio');
        return;
      }

      const client = twilio(
        sid,
        this.config.get<string>('TWILIO_AUTH_TOKEN'),
      );

      await client.messages.create({
        body: opts.message,
        from: this.config.get<string>('TWILIO_SMS_FROM'),
        to: opts.to,
      });

      this.logger.log(`[SMS] Sent to ${opts.to}`);
    } catch (err) {
      this.logger.error(`[SMS] Failed to send to ${opts.to}`, err);
    }
  }

  // ─── WhatsApp ─────────────────────────────────────────────────────────────
  async sendWhatsApp(opts: WhatsAppOptions): Promise<void> {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    if (!sid) {
      this.logger.warn(`[WhatsApp] Twilio not configured — skipping to ${opts.to}`);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = (() => { try { return require('twilio'); } catch { return null; } })();
      if (!twilio) return;

      const client = twilio(sid, this.config.get<string>('TWILIO_AUTH_TOKEN'));
      await client.messages.create({
        body: opts.message,
        from: `whatsapp:${this.config.get<string>('TWILIO_WHATSAPP_FROM')}`,
        to: `whatsapp:${opts.to}`,
      });

      this.logger.log(`[WhatsApp] Sent to ${opts.to}`);
    } catch (err) {
      this.logger.error(`[WhatsApp] Failed to send to ${opts.to}`, err);
    }
  }

  // ─── Templated helpers ────────────────────────────────────────────────────

  async sendOrderConfirmation(email: string, orderNumber: string, totalAmount: number) {
    await this.sendEmail({
      to: email,
      subject: `Order Confirmed — ${orderNumber}`,
      html: `
        <h2>Thank you for your order! 🌿</h2>
        <p>Your order <strong>${orderNumber}</strong> has been confirmed.</p>
        <p>Total: <strong>₹${totalAmount.toFixed(2)}</strong></p>
        <p>Track your order at <a href="https://knackherbal.com/dashboard/orders">My Orders</a>.</p>
      `,
    });
  }

  async sendOtpEmail(email: string, otp: string) {
    await this.sendEmail({
      to: email,
      subject: 'Your Knack Herbal OTP',
      html: `
        <h2>Your One-Time Password</h2>
        <p>Use the following OTP to verify your account:</p>
        <h1 style="letter-spacing:8px; color:#2d6a4f;">${otp}</h1>
        <p>This OTP expires in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    await this.sendEmail({
      to: email,
      subject: 'Reset Your Knack Herbal Password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password (valid for 1 hour):</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2d6a4f;color:#fff;text-decoration:none;border-radius:4px;">
          Reset Password
        </a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  }

  async sendShippingUpdate(email: string, orderNumber: string, status: string) {
    await this.sendEmail({
      to: email,
      subject: `Order ${orderNumber} — ${status}`,
      html: `
        <h2>Order Update 📦</h2>
        <p>Your order <strong>${orderNumber}</strong> is now <strong>${status}</strong>.</p>
        <p>Track at <a href="https://knackherbal.com/dashboard/orders">My Orders</a>.</p>
      `,
    });
  }
}
