import { createLogger } from '../src/logger';

const sink = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

describe('createLogger', () => {
  it('prefixes messages with the scope and routes them by level', () => {
    const output = sink();
    const logger = createLogger('gateway', output);

    logger.info('listening');
    logger.warn('slow request', { ms: 1200 });

    expect(output.info).toHaveBeenCalledWith('[gateway] listening');
    expect(output.warn).toHaveBeenCalledWith('[gateway] slow request', { ms: 1200 });
    expect(output.error).not.toHaveBeenCalled();
  });

  it('passes the error object along with the message', () => {
    const output = sink();
    const failure = new Error('connection refused');

    createLogger('mongo', output).error('could not connect', failure);

    expect(output.error).toHaveBeenCalledWith('[mongo] could not connect', failure);
  });
});
