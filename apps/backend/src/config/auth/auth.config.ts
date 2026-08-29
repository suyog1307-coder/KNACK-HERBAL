import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET ?? 'change_me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change_me_refresh',
  jwtExpiresIn: '15m',
  refreshExpiresIn: '7d',
  bcryptRounds: 10,
  otpExpiryMinutes: 10,
}));
