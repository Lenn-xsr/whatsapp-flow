export interface Logger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, error?: unknown): void;
}

type Level = 'debug' | 'info' | 'warn' | 'error';

/** Console logger that prefixes every line with the scope it was created for. */
export function createLogger(scope: string, sink: Pick<Console, Level> = console): Logger {
  const write = (level: Level, message: string, extra?: unknown): void => {
    const line = `[${scope}] ${message}`;
    if (extra === undefined) {
      sink[level](line);
    } else {
      sink[level](line, extra);
    }
  };

  return {
    debug: (message, meta) => write('debug', message, meta),
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, error) => write('error', message, error),
  };
}
