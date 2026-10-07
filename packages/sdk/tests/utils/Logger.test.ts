import {
  Logger,
  LogLevel,
  ConsoleLogger,
  SilentLogger,
  setLogger,
  getLogger,
  setLogLevel,
} from '../../src/utils/Logger';

describe('Logger System', () => {
  let originalConsole: Console;

  beforeEach(() => {
    originalConsole = global.console;
    global.console = {
      ...originalConsole,
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  });

  afterEach(() => {
    global.console = originalConsole;
  });

  describe('LogLevel', () => {
    it('should have correct level values', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
      expect(LogLevel.NONE).toBe(4);
    });
  });

  describe('ConsoleLogger', () => {
    it('should log debug messages when level is DEBUG', () => {
      const logger = new ConsoleLogger(LogLevel.DEBUG);
      logger.debug('Debug message');

      expect(console.debug).toHaveBeenCalledWith('[WhatsApp SDK] Debug message');
    });

    it('should not log debug messages when level is INFO', () => {
      const logger = new ConsoleLogger(LogLevel.INFO);
      logger.debug('Debug message');

      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should log info messages when level is INFO', () => {
      const logger = new ConsoleLogger(LogLevel.INFO);
      logger.info('Info message');

      expect(console.info).toHaveBeenCalledWith('[WhatsApp SDK] Info message');
    });

    it('should log warn messages when level is WARN', () => {
      const logger = new ConsoleLogger(LogLevel.WARN);
      logger.warn('Warning message');

      expect(console.warn).toHaveBeenCalledWith('[WhatsApp SDK] Warning message');
    });

    it('should log error messages when level is ERROR', () => {
      const logger = new ConsoleLogger(LogLevel.ERROR);
      const error = new Error('Test error');
      logger.error('Error message', error);

      expect(console.error).toHaveBeenCalledWith('[WhatsApp SDK] Error message', error);
    });

    it('should handle additional arguments', () => {
      const logger = new ConsoleLogger(LogLevel.DEBUG);
      logger.debug('Message', { data: 'test' }, 123);

      expect(console.debug).toHaveBeenCalledWith('[WhatsApp SDK] Message', { data: 'test' }, 123);
    });
  });

  describe('SilentLogger', () => {
    it('should not log any messages', () => {
      const logger: Logger = new SilentLogger();

      expect(() => logger.debug('test')).not.toThrow();
      expect(() => logger.info('test')).not.toThrow();
      expect(() => logger.warn('test')).not.toThrow();
      expect(() => logger.error('test')).not.toThrow();

      expect(console.debug).not.toHaveBeenCalled();

      expect(console.info).not.toHaveBeenCalled();

      expect(console.warn).not.toHaveBeenCalled();

      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('Global Logger Management', () => {
    it('should set and get global logger', () => {
      const customLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      setLogger(customLogger);
      const retrievedLogger = getLogger();

      expect(retrievedLogger).toBe(customLogger);
    });

    it('should set log level for console logger', () => {
      const logger = new ConsoleLogger(LogLevel.INFO);
      setLogger(logger);

      setLogLevel(LogLevel.DEBUG);
      const newLogger = getLogger();

      expect(newLogger).toBeInstanceOf(ConsoleLogger);
    });

    it('should not change logger type when setting log level for non-console logger', () => {
      const silentLogger = new SilentLogger();
      setLogger(silentLogger);

      setLogLevel(LogLevel.DEBUG);
      const retrievedLogger = getLogger();

      expect(retrievedLogger).toBe(silentLogger);
    });
  });
});
