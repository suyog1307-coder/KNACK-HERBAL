import * as Joi from 'joi';

/**
 * Centralised Joi schema for environment variable validation.
 * Imported by AppModule's ConfigModule.validationSchema.
 */
export const envValidationSchema = Joi.object({
  // Core
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  APP_URL: Joi.string().optional(),
  FRONTEND_URL: Joi.string().optional(),

  // Database
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().optional(),

  // Auth
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),

  // Razorpay
  RAZORPAY_KEY_ID: Joi.string().optional(),
  RAZORPAY_KEY_SECRET: Joi.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().optional(),

  // SMTP
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().optional(),

  // Twilio
  TWILIO_ACCOUNT_SID: Joi.string().optional(),
  TWILIO_AUTH_TOKEN: Joi.string().optional(),
  TWILIO_SMS_FROM: Joi.string().optional(),
  TWILIO_WHATSAPP_FROM: Joi.string().optional(),

  // Google Maps
  GOOGLE_MAPS_API_KEY: Joi.string().optional(),
});
