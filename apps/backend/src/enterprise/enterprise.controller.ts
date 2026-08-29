import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { EnterpriseService } from './enterprise.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Enterprise & Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('enterprise')
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Get live dashboard summary' })
  @Get('dashboard')
  getDashboardSummary() {
    return this.enterpriseService.getDashboardSummary();
  }

  // ─── Audit Logs ───────────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Get recent audit logs' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max records to return (default 100)' })
  @Get('audit-logs')
  getAuditLogs(@Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number) {
    return this.enterpriseService.getAuditLogs(limit);
  }

  @ApiOperation({ summary: '[Admin] Get audit logs for a specific entity type' })
  @ApiParam({ name: 'entity', description: 'e.g. Product, Order, User' })
  @Get('audit-logs/entity/:entity')
  getAuditLogsByEntity(@Param('entity') entity: string) {
    return this.enterpriseService.getAuditLogsByEntity(entity);
  }

  @ApiOperation({ summary: '[Admin] Get audit logs for a specific user' })
  @ApiParam({ name: 'userId' })
  @Get('audit-logs/user/:userId')
  getAuditLogsByUser(@Param('userId') userId: string) {
    return this.enterpriseService.getAuditLogsByUser(userId);
  }

  // ─── Activity ─────────────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Get recent activity events' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max records to return (default 200)' })
  @Get('activity')
  getRecentActivity(@Query('limit', new DefaultValuePipe(200), ParseIntPipe) limit: number) {
    return this.enterpriseService.getRecentActivity(limit);
  }

  // ─── Metrics ──────────────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Get daily business metrics for the last N days' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of past days (default 30)' })
  @Get('metrics')
  getMetrics(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.enterpriseService.getMetricsRange(days);
  }

  @ApiOperation({ summary: '[Admin] Trigger a snapshot of today\'s metrics' })
  @Post('metrics/snapshot')
  snapshotMetrics() {
    return this.enterpriseService.upsertDailyMetrics();
  }

  // ─── Reports ──────────────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Sales report for a date range' })
  @ApiQuery({ name: 'from', required: true, example: '2026-08-01' })
  @ApiQuery({ name: 'to', required: true, example: '2026-08-31' })
  @Get('reports/sales')
  getSalesReport(@Query('from') from: string, @Query('to') to: string) {
    return this.enterpriseService.getSalesReport(from, to);
  }

  @ApiOperation({ summary: '[Admin] Daily revenue trend for last N days' })
  @ApiQuery({ name: 'days', required: false })
  @Get('reports/revenue')
  getRevenueReport(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.enterpriseService.getRevenueReport(days);
  }

  @ApiOperation({ summary: '[Admin] Full inventory stock report' })
  @Get('reports/inventory')
  getInventoryReport() {
    return this.enterpriseService.getInventoryReport();
  }

  @ApiOperation({ summary: '[Admin] Customer report — total, new, top spenders' })
  @Get('reports/customers')
  getCustomerReport() {
    return this.enterpriseService.getCustomerReport();
  }

  @ApiOperation({ summary: '[Admin] GST report for a date range' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  @Get('reports/gst')
  getGstReport(@Query('from') from: string, @Query('to') to: string) {
    return this.enterpriseService.getGstReport(from, to);
  }
}
