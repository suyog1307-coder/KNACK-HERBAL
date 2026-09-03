import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@knackherbal.com',
    passwordHash: '$2b$10$hashedpassword',
    firstName: 'Test',
    lastName: 'Customer',
    role: 'CUSTOMER',
    isActive: true,
  };

  const mockPrisma = {
    refreshToken: {
      create: jest.fn().mockResolvedValue({
        id: 'rt-1',
        token: 'refresh-token',
        userId: mockUser.id,
      }),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
    },
    oTP: {
      create: jest.fn().mockResolvedValue({ id: 'otp-1' }),
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('access-token-jwt'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };

  const mockNotifications = {
    sendOtpEmail: jest.fn().mockResolvedValue(undefined),
    sendSms: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Phase 4: Register ────────────────────────────────────────────────────

  describe('register()', () => {
    it('should register a new user successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@knackherbal.com',
        password: 'Test@12345',
        firstName: 'Test',
        lastName: 'Customer',
      });

      expect(result).toHaveProperty('message', 'Registration successful');
      expect(result.user).toHaveProperty('email', mockUser.email);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@knackherbal.com',
      );
      expect(mockUsersService.createUser).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already registered', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@knackherbal.com',
          password: 'Test@12345',
          firstName: 'Test',
          lastName: 'Customer',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── Phase 4: Login ───────────────────────────────────────────────────────

  describe('login()', () => {
    it('should login and return access + refresh tokens', async () => {
      const hashed = await bcrypt.hash('Test@12345', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: hashed,
      });
      mockJwtService.sign.mockReturnValue('signed-token');
      mockPrisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await service.login({
        email: 'test@knackherbal.com',
        password: 'Test@12345',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@test.com', password: 'Bad@pass1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashed = await bcrypt.hash('CorrectPass@1', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: hashed,
      });

      await expect(
        service.login({
          email: 'test@knackherbal.com',
          password: 'WrongPass@1',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── Phase 4: Logout ──────────────────────────────────────────────────────

  describe('logout()', () => {
    it('should revoke all refresh tokens for the user', async () => {
      const result = await service.logout(mockUser.id);
      expect(result).toHaveProperty('message', 'Logged out successfully');
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, revoked: false },
        data: { revoked: true },
      });
    });
  });

  // ─── Phase 4: getMe ───────────────────────────────────────────────────────

  describe('getMe()', () => {
    it('should return user profile without passwordHash', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe(mockUser.id);

      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('role', 'CUSTOMER');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getMe('nonexistent-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
