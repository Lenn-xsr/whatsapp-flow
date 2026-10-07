/**
 * Base error class for all WhatsApp SDK errors
 */
export class WhatsAppSDKError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'WhatsAppSDKError';
  }
}

/**
 * Error thrown when a sender is not found
 */
export class SenderNotFoundError extends WhatsAppSDKError {
  constructor(senderId: string) {
    super(`Sender not found: ${senderId}`, 'SENDER_NOT_FOUND', { senderId });
    this.name = 'SenderNotFoundError';
  }
}

/**
 * Error thrown when client is not connected
 */
export class ConnectionError extends WhatsAppSDKError {
  constructor(message: string = 'Client is not connected') {
    super(message, 'CONNECTION_ERROR');
    this.name = 'ConnectionError';
  }
}

/**
 * Error thrown when initialization fails
 */
export class InitializationError extends WhatsAppSDKError {
  constructor(
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message, 'INITIALIZATION_ERROR', { originalError: originalError?.message });
    this.name = 'InitializationError';
  }
}

/**
 * Error thrown when API requests fail
 */
export class APIError extends WhatsAppSDKError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown,
  ) {
    super(message, 'API_ERROR', { statusCode, response });
    this.name = 'APIError';
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends WhatsAppSDKError {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message, 'VALIDATION_ERROR', { field });
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when message type is not supported
 */
export class UnsupportedMessageTypeError extends WhatsAppSDKError {
  constructor(messageType: string) {
    super(`Unsupported message type: ${messageType}`, 'UNSUPPORTED_MESSAGE_TYPE', { messageType });
    this.name = 'UnsupportedMessageTypeError';
  }
}
