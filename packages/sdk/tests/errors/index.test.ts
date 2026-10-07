import {
  WhatsAppSDKError,
  SenderNotFoundError,
  ConnectionError,
  InitializationError,
  APIError,
  ValidationError,
  UnsupportedMessageTypeError,
} from '../../src/errors';

describe('Custom Error Classes', () => {
  describe('WhatsAppSDKError', () => {
    it('should create base error with message and code', () => {
      const error = new WhatsAppSDKError('Test error', 'TEST_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('WhatsAppSDKError');
      expect(error.details).toBeUndefined();
    });

    it('should create error with details', () => {
      const details = { field: 'test', value: 'invalid' };
      const error = new WhatsAppSDKError('Test error', 'TEST_ERROR', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('SenderNotFoundError', () => {
    it('should create sender not found error', () => {
      const error = new SenderNotFoundError('test-sender');

      expect(error.message).toBe('Sender not found: test-sender');
      expect(error.code).toBe('SENDER_NOT_FOUND');
      expect(error.name).toBe('SenderNotFoundError');
      expect(error.details?.senderId).toBe('test-sender');
    });
  });

  describe('ConnectionError', () => {
    it('should create connection error with default message', () => {
      const error = new ConnectionError();

      expect(error.message).toBe('Client is not connected');
      expect(error.code).toBe('CONNECTION_ERROR');
      expect(error.name).toBe('ConnectionError');
    });

    it('should create connection error with custom message', () => {
      const error = new ConnectionError('Custom connection error');

      expect(error.message).toBe('Custom connection error');
      expect(error.code).toBe('CONNECTION_ERROR');
    });
  });

  describe('InitializationError', () => {
    it('should create initialization error', () => {
      const originalError = new Error('Original error');
      const error = new InitializationError('Init failed', originalError);

      expect(error.message).toBe('Init failed');
      expect(error.code).toBe('INITIALIZATION_ERROR');
      expect(error.name).toBe('InitializationError');
      expect(error.originalError).toBe(originalError);
      expect(error.details?.originalError).toBe('Original error');
    });

    it('should create initialization error without original error', () => {
      const error = new InitializationError('Init failed');

      expect(error.message).toBe('Init failed');
      expect(error.originalError).toBeUndefined();
    });
  });

  describe('APIError', () => {
    it('should create API error with status code', () => {
      const response = { error: 'Bad request' };
      const error = new APIError('API failed', 400, response);

      expect(error.message).toBe('API failed');
      expect(error.code).toBe('API_ERROR');
      expect(error.name).toBe('APIError');
      expect(error.statusCode).toBe(400);
      expect(error.response).toBe(response);
    });

    it('should create API error without status code', () => {
      const error = new APIError('API failed');

      expect(error.message).toBe('API failed');
      expect(error.statusCode).toBeUndefined();
      expect(error.response).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field', () => {
      const error = new ValidationError('Field is required', 'testField');

      expect(error.message).toBe('Field is required');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
      expect(error.field).toBe('testField');
      expect(error.details?.field).toBe('testField');
    });

    it('should create validation error without field', () => {
      const error = new ValidationError('Validation failed');

      expect(error.message).toBe('Validation failed');
      expect(error.field).toBeUndefined();
    });
  });

  describe('UnsupportedMessageTypeError', () => {
    it('should create unsupported message type error', () => {
      const error = new UnsupportedMessageTypeError('custom_type');

      expect(error.message).toBe('Unsupported message type: custom_type');
      expect(error.code).toBe('UNSUPPORTED_MESSAGE_TYPE');
      expect(error.name).toBe('UnsupportedMessageTypeError');
      expect(error.details?.messageType).toBe('custom_type');
    });
  });

  describe('Error inheritance', () => {
    it('should properly inherit from Error', () => {
      const errors = [
        new WhatsAppSDKError('Test', 'TEST'),
        new SenderNotFoundError('test'),
        new ConnectionError(),
        new InitializationError('Test'),
        new APIError('Test'),
        new ValidationError('Test'),
        new UnsupportedMessageTypeError('test'),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(WhatsAppSDKError);
        expect(error.stack).toBeDefined();
      });
    });
  });
});
