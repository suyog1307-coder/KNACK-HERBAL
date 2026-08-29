import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TicketStatus as PrismaTicketStatus } from '@prisma/client';

import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class UpdateTicketStatusDto {
  @ApiProperty({ enum: PrismaTicketStatus })
  @IsEnum(PrismaTicketStatus)
  status: PrismaTicketStatus;
}

@ApiTags('Support & Content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ─── Reviews ──────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Submit a product review' })
  @Roles('CUSTOMER')
  @Post('reviews')
  createReview(@Request() req, @Body() dto: CreateReviewDto) {
    return this.supportService.createReview(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Get approved reviews for a product (public access via any role)' })
  @ApiParam({ name: 'productId' })
  @Roles('CUSTOMER', 'ADMIN')
  @Get('reviews/product/:productId')
  getApprovedReviews(@Param('productId') productId: string) {
    return this.supportService.getApprovedReviews(productId);
  }

  @ApiOperation({ summary: '[Admin] Get all pending reviews awaiting approval' })
  @Roles('ADMIN')
  @Get('reviews/pending')
  getPendingReviews() {
    return this.supportService.getPendingReviews();
  }

  @ApiOperation({ summary: '[Admin] Approve a review' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Patch('reviews/:id/approve')
  approveReview(@Param('id') id: string) {
    return this.supportService.approveReview(id);
  }

  @ApiOperation({ summary: '[Admin] Delete a review' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Delete('reviews/:id')
  deleteReview(@Param('id') id: string) {
    return this.supportService.deleteReview(id);
  }

  // ─── Tickets ──────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a support ticket' })
  @Roles('CUSTOMER')
  @Post('tickets')
  createTicket(@Request() req, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Get my support tickets' })
  @Roles('CUSTOMER')
  @Get('tickets/mine')
  getMyTickets(@Request() req) {
    return this.supportService.getMyTickets(req.user.id);
  }

  @ApiOperation({ summary: '[Admin] Get all support tickets' })
  @Roles('ADMIN')
  @Get('tickets')
  getAllTickets() {
    return this.supportService.getAllTickets();
  }

  @ApiOperation({ summary: '[Admin] Update ticket status' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Patch('tickets/:id/status')
  updateTicketStatus(@Param('id') id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.supportService.updateTicketStatus(id, dto.status);
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Start or resume a live chat session' })
  @Roles('CUSTOMER')
  @Post('chat/start')
  startChat(@Request() req) {
    return this.supportService.startChat(req.user.id);
  }

  @ApiOperation({ summary: 'Send a message in a chat' })
  @ApiParam({ name: 'chatId' })
  @Roles('CUSTOMER', 'ADMIN')
  @Post('chat/:chatId/messages')
  sendMessage(
    @Request() req,
    @Param('chatId') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.supportService.sendMessage(req.user.id, chatId, dto);
  }

  @ApiOperation({ summary: 'Get messages in a chat' })
  @ApiParam({ name: 'chatId' })
  @Roles('CUSTOMER', 'ADMIN')
  @Get('chat/:chatId/messages')
  getChatMessages(@Param('chatId') chatId: string) {
    return this.supportService.getChatMessages(chatId);
  }

  @ApiOperation({ summary: '[Admin] Get all active chats' })
  @Roles('ADMIN')
  @Get('chat/active')
  getAllActiveChats() {
    return this.supportService.getAllActiveChats();
  }

  @ApiOperation({ summary: '[Admin] Close a chat session' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Patch('chat/:id/close')
  closeChat(@Param('id') id: string) {
    return this.supportService.closeChat(id);
  }

  // ─── FAQs ─────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get all active FAQs' })
  @Roles('CUSTOMER', 'ADMIN')
  @Get('faqs')
  getAllFaqs() {
    return this.supportService.getAllFaqs();
  }

  @ApiOperation({ summary: '[Admin] Create a FAQ' })
  @Roles('ADMIN')
  @Post('faqs')
  createFaq(@Body() dto: CreateFaqDto) {
    return this.supportService.createFaq(dto);
  }

  @ApiOperation({ summary: '[Admin] Update a FAQ' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Patch('faqs/:id')
  updateFaq(@Param('id') id: string, @Body() dto: Partial<CreateFaqDto>) {
    return this.supportService.updateFaq(id, dto);
  }

  @ApiOperation({ summary: '[Admin] Delete a FAQ' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Delete('faqs/:id')
  deleteFaq(@Param('id') id: string) {
    return this.supportService.deleteFaq(id);
  }

  // ─── Banners ──────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get all active banners' })
  @Roles('CUSTOMER', 'ADMIN')
  @Get('banners')
  getActiveBanners() {
    return this.supportService.getActiveBanners();
  }

  @ApiOperation({ summary: '[Admin] Create a banner' })
  @Roles('ADMIN')
  @Post('banners')
  createBanner(@Body() dto: CreateBannerDto) {
    return this.supportService.createBanner(dto);
  }

  @ApiOperation({ summary: '[Admin] Update a banner' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Patch('banners/:id')
  updateBanner(@Param('id') id: string, @Body() dto: Partial<CreateBannerDto>) {
    return this.supportService.updateBanner(id, dto);
  }

  @ApiOperation({ summary: '[Admin] Delete a banner' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Delete('banners/:id')
  deleteBanner(@Param('id') id: string) {
    return this.supportService.deleteBanner(id);
  }

  // ─── Blog ─────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get all published blog posts' })
  @Roles('CUSTOMER', 'ADMIN')
  @Get('blog')
  getPublishedBlogs() {
    return this.supportService.getPublishedBlogs();
  }

  @ApiOperation({ summary: 'Get a blog post by slug' })
  @ApiParam({ name: 'slug' })
  @Roles('CUSTOMER', 'ADMIN')
  @Get('blog/:slug')
  getBlogBySlug(@Param('slug') slug: string) {
    return this.supportService.getBlogBySlug(slug);
  }

  @ApiOperation({ summary: '[Admin] Create a blog post' })
  @Roles('ADMIN')
  @Post('blog')
  createBlog(@Body() dto: CreateBlogDto) {
    return this.supportService.createBlog(dto);
  }

  @ApiOperation({ summary: '[Admin] Update a blog post' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Patch('blog/:id')
  updateBlog(@Param('id') id: string, @Body() dto: Partial<CreateBlogDto>) {
    return this.supportService.updateBlog(id, dto);
  }

  @ApiOperation({ summary: '[Admin] Delete a blog post' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Delete('blog/:id')
  deleteBlog(@Param('id') id: string) {
    return this.supportService.deleteBlog(id);
  }

  // ─── Testimonials ─────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Submit a testimonial' })
  @Roles('CUSTOMER')
  @Post('testimonials')
  createTestimonial(@Body() dto: CreateTestimonialDto) {
    return this.supportService.createTestimonial(dto);
  }

  @ApiOperation({ summary: 'Get all approved testimonials' })
  @Roles('CUSTOMER', 'ADMIN')
  @Get('testimonials')
  getApprovedTestimonials() {
    return this.supportService.getApprovedTestimonials();
  }

  @ApiOperation({ summary: '[Admin] Get pending testimonials' })
  @Roles('ADMIN')
  @Get('testimonials/pending')
  getPendingTestimonials() {
    return this.supportService.getAllPendingTestimonials();
  }

  @ApiOperation({ summary: '[Admin] Approve a testimonial' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Patch('testimonials/:id/approve')
  approveTestimonial(@Param('id') id: string) {
    return this.supportService.approveTestimonial(id);
  }

  @ApiOperation({ summary: '[Admin] Delete a testimonial' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Delete('testimonials/:id')
  deleteTestimonial(@Param('id') id: string) {
    return this.supportService.deleteTestimonial(id);
  }

  // ─── Website Settings ─────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Get all site settings' })
  @Roles('ADMIN')
  @Get('settings')
  getAllSettings() {
    return this.supportService.getAllSettings();
  }

  @ApiOperation({ summary: '[Admin] Upsert a site setting' })
  @Roles('ADMIN')
  @Post('settings')
  upsertSetting(@Body() body: { key: string; value: string }) {
    return this.supportService.upsertSetting(body.key, body.value);
  }
}
