import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

/**
 * NotificationsModule — provides email, WhatsApp/SMS, and in-app notifications.
 *
 * TRANSPORT SETUP:
 *  - Email:    uses nodemailer (install: pnpm add nodemailer @types/nodemailer)
 *              Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
 *  - WhatsApp: uses Twilio WhatsApp API (install: pnpm add twilio)
 *              Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in .env
 *  - SMS:      same Twilio credentials
 *              Set TWILIO_SMS_FROM in .env
 *
 * All transports gracefully degrade — if credentials are missing the service
 * logs a warning and skips the send instead of crashing.
 */
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
