import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/**
 * NOTE: Every method returns a plain object.
 * The global TransformInterceptor wraps it into:
 *   { success: true, message: "...", data: <return value> }
 * So services must NOT add their own success/data envelope.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private buildPayload(user: { id: string; email: string | null; role: string }) {
    return { sub: user.id, email: user.email, role: user.role };
  }

  private signAccessToken(payload: object): string {
    return this.jwtService.sign(payload); // expiry from JwtModule: 15m
  }

  private signRefreshToken(payload: object): string {
    // Add a unique jti so tokens issued in the same second are always distinct
    return this.jwtService.sign(
      { ...payload, jti: randomUUID() },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );
  }

  /**
   * Store the raw refresh token string.
   * The token is a signed JWT — it can only be verified with the secret.
   * We store it directly so we can do an O(1) exact-match lookup on refresh.
   */
  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });
  }

  // ─── Register ────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.createUser({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    const { passwordHash: _ph, ...safeUser } = user;

    // Interceptor wraps → { success, message: "Registration successful", data: { user } }
    return {
      message: 'Registration successful',
      user: { id: safeUser.id, email: safeUser.email, role: safeUser.role },
    };
  }

  // ─── Login ───────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = this.buildPayload(user);
    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);

    await this.storeRefreshToken(user.id, refreshToken);

    // Interceptor wraps → { success, message: "Success", data: { accessToken, refreshToken } }
    return { accessToken, refreshToken };
  }

  // ─── Refresh (with rotation) ──────────────────────────────────────────────

  async refresh(incomingToken: string) {
    // 1. Verify JWT signature & expiry first (fast fail before DB hit)
    let payload: any;
    try {
      payload = this.jwtService.verify(incomingToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 2. Look up the token by exact string value — O(1) unique lookup
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: incomingToken },
    });

    // Verify the token belongs to this user, is not revoked, and not expired
    const isValid =
      storedToken &&
      storedToken.userId === payload.sub &&
      storedToken.revoked === false &&
      storedToken.expiresAt > new Date();

    this.logger.debug(
      `[refresh] userId=${payload.sub} token found=${!!storedToken} valid=${isValid}`,
    );

    if (!isValid) {
      throw new UnauthorizedException('Refresh token not found or already used');
    }

    // 3. Revoke the consumed token (single-use)
    await this.prisma.refreshToken.update({
      where: { id: storedToken!.id },
      data: { revoked: true },
    });

    // 4. Issue new token pair
    const user = await this.usersService.findByEmail(payload.email);
    if (!user) throw new UnauthorizedException('User no longer exists');

    const newPayload = this.buildPayload(user);
    const accessToken = this.signAccessToken(newPayload);
    const refreshToken = this.signRefreshToken(newPayload);

    await this.storeRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  // ─── Logout ──────────────────────────────────────────────────────────────

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    return { message: 'Logged out successfully' };
  }

  // ─── Me ──────────────────────────────────────────────────────────────────

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User no longer exists');

    const { passwordHash: _ph, ...safeUser } = user;
    return safeUser;
  }
}
