/**
 * Log levels for the WhatsApp SDK
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Logger interface for configurable logging
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: Error, ...args: unknown[]): void;
}

/**
 * Default console logger implementation
 */
export class ConsoleLogger implements Logger {
  constructor(private level: LogLevel = LogLevel.INFO) {}

  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[WhatsApp SDK] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[WhatsApp SDK] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WhatsApp SDK] ${message}`, ...args);
    }
  }

  error(message: string, error?: Error, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[WhatsApp SDK] ${message}`, error, ...args);
    }
  }
}

/**
 * Silent logger that doesn't output anything
 */
export class SilentLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/**
 * Global logger instance
 */
let globalLogger: Logger = new ConsoleLogger();

/**
 * Set the global logger instance
 * @param logger - The logger to use globally
 */
export function setLogger(logger: Logger): void {
  globalLogger = logger;
}

/**
 * Get the current global logger instance
 */
export function getLogger(): Logger {
  return globalLogger;
}

/**
 * Set the log level for the default console logger
 * @param level - The log level to set
 */
export function setLogLevel(level: LogLevel): void {
  if (globalLogger instanceof ConsoleLogger) {
    globalLogger = new ConsoleLogger(level);
  }
}
