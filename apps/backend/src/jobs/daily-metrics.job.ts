import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnterpriseService } from '../enterprise/enterprise.service';

/**
 * DailyMetricsJob — upserts today's BusinessMetric snapshot at midnight IST.
 * Registered via ScheduleModule in JobsModule.
 */
@Injectable()
export class DailyMetricsJob {
  private readonly logger = new Logger(DailyMetricsJob.name);

  constructor(private readonly enterprise: EnterpriseService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'daily-metrics',
    timeZone: 'Asia/Kolkata',
  })
  async run() {
    this.logger.log('[DailyMetricsJob] Running daily metric snapshot...');
    try {
      const result = await this.enterprise.upsertDailyMetrics();
      this.logger.log(
        `[DailyMetricsJob] Snapshot saved — orders: ${result.totalOrders}, revenue: ₹${result.totalSales}`,
      );
      return result;
    } catch (err) {
      this.logger.error('[DailyMetricsJob] Failed', err);
      throw err;
    }
  }
}
