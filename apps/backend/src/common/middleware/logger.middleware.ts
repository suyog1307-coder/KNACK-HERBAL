import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP'); // Sets the log context to "HTTP"

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || 'Unknown';
    const startTime = Date.now();

    // Listen for the response to finish before logging
    res.on('finish', () => {
      const { statusCode } = res;
      const executionTime = Date.now() - startTime;

      this.logger.log(
        `${method} ${originalUrl} | Status: ${statusCode} | Time: ${executionTime}ms | IP: ${ip} | Agent: ${userAgent}`
      );
    });

    next();
  }
}