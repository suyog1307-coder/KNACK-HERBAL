export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: string;
  data?: unknown;
}

/**
 * Lightweight logger interface — implemented by NestJS Pino in the backend
 * and ConsoleLogger in frontend packages.
 */
export interface ILogger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

export class ConsoleLogger implements ILogger {
  constructor(private readonly context?: string) {}

  private format(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      context: this.context,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  debug(message: string, data?: unknown) {
    console.debug(JSON.stringify(this.format('debug', message, data)));
  }
  info(message: string, data?: unknown) {
    console.info(JSON.stringify(this.format('info', message, data)));
  }
  warn(message: string, data?: unknown) {
    console.warn(JSON.stringify(this.format('warn', message, data)));
  }
  error(message: string, data?: unknown) {
    console.error(JSON.stringify(this.format('error', message, data)));
  }
}
