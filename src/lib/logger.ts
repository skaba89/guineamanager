/**
 * Logger utility for GuinéaManager
 * Only logs in development mode, suppresses in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = process.env.NODE_ENV === 'development';

class Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  private formatMessage(level: LogLevel, ...args: any[]): void {
    if (!isDev && level !== 'error') return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;

    switch (level) {
      case 'error':
        console.error(prefix, ...args);
        break;
      case 'warn':
        console.warn(prefix, ...args);
        break;
      case 'debug':
      case 'info':
      default:
        console.log(prefix, ...args);
    }
  }

  debug(...args: any[]): void {
    this.formatMessage('debug', ...args);
  }

  info(...args: any[]): void {
    this.formatMessage('info', ...args);
  }

  warn(...args: any[]): void {
    this.formatMessage('warn', ...args);
  }

  error(...args: any[]): void {
    // Always log errors, but consider sending to error tracking service in production
    this.formatMessage('error', ...args);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}

export const logger = new Logger('App');

export default logger;
