import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    // Global Environment Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
      }),
    }),
    
    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, 
      limit: 100, 
    }]),

    // Global Logger Configuration
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const isProduction = config.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            customProps: (req, res) => ({
              context: 'HTTP',
            }),
            transport: isProduction
              ? undefined // In production, output raw fast JSON
              : { target: 'pino-pretty', options: { singleLine: true } }, // In development, format nicely
            level: isProduction ? 'info' : 'debug',
          },
        };
      },
    }),

    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  // Wire up the custom LoggerMiddleware here
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*'); // Applies this to every single route in your application
  }
}