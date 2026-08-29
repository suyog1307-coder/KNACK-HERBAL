import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * SubscriptionBillingJob — finds ACTIVE subscriptions due today and
 * sends renewal reminder emails. Runs at 08:00 IST daily.
 */
@Injectable()
export class SubscriptionBillingJob {
  private readonly logger = new Logger(SubscriptionBillingJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('0 8 * * *', { name: 'subscription-billing', timeZone: 'Asia/Kolkata' })
  async run() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: { gte: today, lt: tomorrow },
      },
      include: {
        user: { select: { email: true, firstName: true } },
        product: { select: { name: true, price: true } },
      },
    });

    this.logger.log(`[SubscriptionBillingJob] ${dueSubscriptions.length} subscriptions due today`);

    for (const sub of dueSubscriptions) {
      if (sub.user.email) {
        await this.notifications.sendEmail({
          to: sub.user.email,
          subject: `Subscription Renewal — ${sub.product.name}`,
          html: `
            <h2>Hi ${sub.user.firstName},</h2>
            <p>Your subscription for <strong>${sub.product.name}</strong> is due for renewal today.</p>
            <p>Amount: <strong>₹${sub.product.price}</strong></p>
            <p>
              <a href="${process.env.FRONTEND_URL ?? 'https://knackherbal.com'}/dashboard/subscriptions"
                 style="display:inline-block;padding:10px 20px;background:#16a34a;color:#fff;border-radius:4px;text-decoration:none;">
                Manage Subscriptions
              </a>
            </p>
          `,
        });
      }
    }

    return { processed: dueSubscriptions.length };
  }
}
