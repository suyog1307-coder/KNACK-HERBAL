import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Reviews ──────────────────────────────────────────────────────────────

  async createReview(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.review.create({
      data: { userId, ...dto },
    });
  }

  async getApprovedReviews(productId: string) {
    return this.prisma.review.findMany({
      where: { productId, isApproved: true },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingReviews() {
    return this.prisma.review.findMany({
      where: { isApproved: false },
      include: {
        user: { select: { firstName: true, lastName: true } },
        product: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    return this.prisma.review.update({ where: { id }, data: { isApproved: true } });
  }

  async deleteReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.prisma.review.delete({ where: { id } });
    return { message: 'Review deleted' };
  }

  // ─── Tickets ──────────────────────────────────────────────────────────────

  async createTicket(userId: string, dto: CreateTicketDto) {
    return this.prisma.ticket.create({ data: { userId, ...dto } });
  }

  async getMyTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllTickets() {
    return this.prisma.ticket.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTicketStatus(id: string, status: TicketStatus) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.prisma.ticket.update({ where: { id }, data: { status } });
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────

  async startChat(userId: string) {
    // Reuse an existing open chat if present
    const existing = await this.prisma.chat.findFirst({
      where: { userId, isActive: true },
    });
    if (existing) return existing;
    return this.prisma.chat.create({ data: { userId } });
  }

  async sendMessage(userId: string, chatId: string, dto: SendMessageDto) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.isActive) throw new ForbiddenException('Chat is closed');

    return this.prisma.chatMessage.create({
      data: { chatId, senderId: userId, message: dto.message },
    });
  }

  async getChatMessages(chatId: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat not found');

    return this.prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { firstName: true, role: true } } },
    });
  }

  async getAllActiveChats() {
    return this.prisma.chat.findMany({
      where: { isActive: true },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async closeChat(id: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id } });
    if (!chat) throw new NotFoundException('Chat not found');
    return this.prisma.chat.update({ where: { id }, data: { isActive: false } });
  }

  // ─── FAQs ─────────────────────────────────────────────────────────────────

  async createFaq(dto: CreateFaqDto) {
    return this.prisma.fAQ.create({ data: dto });
  }

  async getAllFaqs() {
    return this.prisma.fAQ.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' },
    });
  }

  async updateFaq(id: string, dto: Partial<CreateFaqDto>) {
    const faq = await this.prisma.fAQ.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ not found');
    return this.prisma.fAQ.update({ where: { id }, data: dto });
  }

  async deleteFaq(id: string) {
    const faq = await this.prisma.fAQ.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ not found');
    await this.prisma.fAQ.delete({ where: { id } });
    return { message: 'FAQ deleted' };
  }

  // ─── Banners ──────────────────────────────────────────────────────────────

  async createBanner(dto: CreateBannerDto) {
    return this.prisma.banner.create({ data: dto });
  }

  async getActiveBanners() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateBanner(id: string, dto: Partial<CreateBannerDto>) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    return this.prisma.banner.update({ where: { id }, data: dto });
  }

  async deleteBanner(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    await this.prisma.banner.delete({ where: { id } });
    return { message: 'Banner deleted' };
  }

  // ─── Blog ─────────────────────────────────────────────────────────────────

  async createBlog(dto: CreateBlogDto) {
    return this.prisma.blog.create({ data: dto });
  }

  async getPublishedBlogs() {
    return this.prisma.blog.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBlogBySlug(slug: string) {
    const blog = await this.prisma.blog.findUnique({ where: { slug } });
    if (!blog) throw new NotFoundException('Blog post not found');
    return blog;
  }

  async updateBlog(id: string, dto: Partial<CreateBlogDto>) {
    const blog = await this.prisma.blog.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException('Blog post not found');
    return this.prisma.blog.update({ where: { id }, data: dto });
  }

  async deleteBlog(id: string) {
    const blog = await this.prisma.blog.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException('Blog post not found');
    await this.prisma.blog.delete({ where: { id } });
    return { message: 'Blog post deleted' };
  }

  // ─── Testimonials (stored via Activity table) ─────────────────────────────

  async createTestimonial(dto: CreateTestimonialDto) {
    return this.prisma.activity.create({
      data: {
        eventType: 'TESTIMONIAL',
        metadata: JSON.stringify({ ...dto, isApproved: false }),
      },
    });
  }

  async getApprovedTestimonials() {
    const records = await this.prisma.activity.findMany({
      where: { eventType: 'TESTIMONIAL' },
      orderBy: { createdAt: 'desc' },
    });
    return records
      .map((r) => {
        try { return { id: r.id, ...JSON.parse(r.metadata ?? '{}'), createdAt: r.createdAt }; }
        catch { return null; }
      })
      .filter((t) => t?.isApproved === true);
  }

  async approveTestimonial(id: string) {
    const record = await this.prisma.activity.findUnique({ where: { id } });
    if (!record || record.eventType !== 'TESTIMONIAL') throw new NotFoundException('Testimonial not found');
    try {
      const data = JSON.parse(record.metadata ?? '{}');
      return this.prisma.activity.update({
        where: { id },
        data: { metadata: JSON.stringify({ ...data, isApproved: true }) },
      });
    } catch {
      throw new NotFoundException('Testimonial data corrupted');
    }
  }

  async deleteTestimonial(id: string) {
    const record = await this.prisma.activity.findUnique({ where: { id } });
    if (!record || record.eventType !== 'TESTIMONIAL') throw new NotFoundException('Testimonial not found');
    await this.prisma.activity.delete({ where: { id } });
    return { message: 'Testimonial deleted' };
  }

  async getAllPendingTestimonials() {
    const records = await this.prisma.activity.findMany({
      where: { eventType: 'TESTIMONIAL' },
      orderBy: { createdAt: 'desc' },
    });
    return records
      .map((r) => {
        try { return { id: r.id, ...JSON.parse(r.metadata ?? '{}'), createdAt: r.createdAt }; }
        catch { return null; }
      })
      .filter((t) => t?.isApproved === false);
  }

  // ─── Website Settings ─────────────────────────────────────────────────────

  async getSetting(key: string): Promise<string | null> {
    const record = await this.prisma.activity.findFirst({
      where: { eventType: 'SITE_SETTING', sessionId: key },
    });
    if (!record?.metadata) return null;
    try { return JSON.parse(record.metadata).value ?? null; } catch { return null; }
  }

  async upsertSetting(key: string, value: string) {
    const existing = await this.prisma.activity.findFirst({
      where: { eventType: 'SITE_SETTING', sessionId: key },
    });
    const metadata = JSON.stringify({ key, value });
    if (existing) {
      return this.prisma.activity.update({ where: { id: existing.id }, data: { metadata } });
    }
    return this.prisma.activity.create({
      data: { eventType: 'SITE_SETTING', sessionId: key, metadata },
    });
  }

  async getAllSettings() {
    const records = await this.prisma.activity.findMany({
      where: { eventType: 'SITE_SETTING' },
    });
    const settings: Record<string, string> = {};
    for (const r of records) {
      try {
        const { key, value } = JSON.parse(r.metadata ?? '{}');
        if (key) settings[key] = value;
      } catch { /* skip */ }
    }
    return settings;
  }
}
