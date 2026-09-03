import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';

describe('SupportService (Phase 15 — Reviews, Tickets, Chat, FAQs)', () => {
  let service: SupportService;

  const mockTicket = {
    id: 'ticket-1',
    userId: 'user-1',
    subject: 'Product damaged',
    description: 'I received a damaged item',
    status: TicketStatus.OPEN,
    priority: 'MEDIUM',
    createdAt: new Date(),
  };

  const mockReview = {
    id: 'review-1',
    userId: 'user-1',
    productId: 'prod-1',
    rating: 5,
    title: 'Great product',
    comment: 'Loved the goat milk lotion',
    isApproved: false,
  };

  const mockChat = { id: 'chat-1', userId: 'user-1', isActive: true };

  const mockPrisma = {
    product: { findUnique: jest.fn().mockResolvedValue({ id: 'prod-1' }) },
    review: {
      create: jest.fn().mockResolvedValue(mockReview),
      findMany: jest.fn().mockResolvedValue([mockReview]),
      findUnique: jest.fn().mockResolvedValue(mockReview),
      update: jest.fn().mockResolvedValue({ ...mockReview, isApproved: true }),
      delete: jest.fn().mockResolvedValue(mockReview),
    },
    ticket: {
      create: jest.fn().mockResolvedValue(mockTicket),
      findMany: jest.fn().mockResolvedValue([mockTicket]),
      findUnique: jest.fn().mockResolvedValue(mockTicket),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockTicket, status: TicketStatus.RESOLVED }),
    },
    chat: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(mockChat),
      create: jest.fn().mockResolvedValue(mockChat),
      findMany: jest.fn().mockResolvedValue([mockChat]),
      update: jest.fn().mockResolvedValue({ ...mockChat, isActive: false }),
    },
    chatMessage: {
      create: jest.fn().mockResolvedValue({ id: 'msg-1', message: 'Hello' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    fAQ: {
      create: jest.fn().mockResolvedValue({ id: 'faq-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({ id: 'faq-1' }),
      update: jest.fn().mockResolvedValue({ id: 'faq-1' }),
      delete: jest.fn().mockResolvedValue({ id: 'faq-1' }),
    },
    banner: {
      create: jest.fn().mockResolvedValue({ id: 'banner-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({ id: 'banner-1' }),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    blog: {
      create: jest.fn().mockResolvedValue({ id: 'blog-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'blog-1', slug: 'test-post' }),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    activity: {
      create: jest.fn().mockResolvedValue({ id: 'act-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTicket()', () => {
    it('should create a support ticket', async () => {
      mockPrisma.ticket.create.mockResolvedValue(mockTicket);
      const result = await service.createTicket('user-1', {
        subject: 'Product damaged',
        description: 'Received damaged item',
        priority: 'HIGH',
      });
      expect(result).toHaveProperty('status', TicketStatus.OPEN);
      expect(result).toHaveProperty('userId', 'user-1');
    });
  });

  describe('getMyTickets()', () => {
    it('should return only this users tickets', async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([mockTicket]);
      const result = await service.getMyTickets('user-1');
      expect(result).toBeInstanceOf(Array);
      // All tickets belong to user-1
      result.forEach((t) => expect(t.userId).toBe('user-1'));
    });
  });

  describe('updateTicketStatus()', () => {
    it('should update ticket status to RESOLVED', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.ticket.update.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.RESOLVED,
      });

      const result = await service.updateTicketStatus(
        'ticket-1',
        TicketStatus.RESOLVED,
      );
      expect(result.status).toBe(TicketStatus.RESOLVED);
    });

    it('should throw NotFoundException for invalid ticket id', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(null);
      await expect(
        service.updateTicketStatus('bad-id', TicketStatus.RESOLVED),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createReview()', () => {
    it('should create a review for a product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      mockPrisma.review.create.mockResolvedValue(mockReview);

      const result = await service.createReview('user-1', {
        productId: 'prod-1',
        rating: 5,
        title: 'Great product',
        comment: 'Loved it',
      });
      expect(result).toHaveProperty('rating', 5);
      expect(result.isApproved).toBe(false); // starts unapproved
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(
        service.createReview('user-1', { productId: 'bad-prod', rating: 5 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveReview()', () => {
    it('should approve a pending review', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.update.mockResolvedValue({
        ...mockReview,
        isApproved: true,
      });

      const result = await service.approveReview('review-1');
      expect(result.isApproved).toBe(true);
    });
  });

  describe('startChat()', () => {
    it('should create a new chat session', async () => {
      mockPrisma.chat.findFirst.mockResolvedValue(null);
      mockPrisma.chat.create.mockResolvedValue(mockChat);

      const result = await service.startChat('user-1');
      expect(result).toHaveProperty('isActive', true);
    });

    it('should reuse existing active chat', async () => {
      mockPrisma.chat.findFirst.mockResolvedValue(mockChat);

      const result = await service.startChat('user-1');
      expect(result.id).toBe('chat-1');
      expect(mockPrisma.chat.create).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage()', () => {
    it('should send a message to an active chat', async () => {
      mockPrisma.chat.findUnique.mockResolvedValue(mockChat);
      mockPrisma.chatMessage.create.mockResolvedValue({
        id: 'msg-1',
        message: 'Test message',
      });

      const result = await service.sendMessage('user-1', 'chat-1', {
        message: 'Test message',
      });
      expect(result).toHaveProperty('message', 'Test message');
    });

    it('should throw ForbiddenException if chat is closed', async () => {
      mockPrisma.chat.findUnique.mockResolvedValue({
        ...mockChat,
        isActive: false,
      });
      await expect(
        service.sendMessage('user-1', 'chat-1', { message: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
