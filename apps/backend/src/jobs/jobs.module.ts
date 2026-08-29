import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DailyMetricsJob } from './daily-metrics.job';
import { SubscriptionBillingJob } from './subscription-billing.job';
import { EnterpriseModule } from '../enterprise/enterprise.module';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * JobsModule — registers all cron jobs via @nestjs/schedule.
 *
 * Jobs:
 *  - DailyMetricsJob      → 00:00 IST — upsert BusinessMetric snapshot
 *  - SubscriptionBillingJob → 08:00 IST — send renewal reminders
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    EnterpriseModule,
    NotificationsModule,
  ],
  providers: [DailyMetricsJob, SubscriptionBillingJob],
  exports: [DailyMetricsJob, SubscriptionBillingJob],
})
export class JobsModule {}
