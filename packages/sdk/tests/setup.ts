// Global test setup
import { setLogger } from '../src/utils/Logger';

// Set silent logger for tests to avoid console output
setLogger({
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
});

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
