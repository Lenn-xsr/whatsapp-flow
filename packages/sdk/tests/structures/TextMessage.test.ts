import { TextMessage } from '../../src/structures/TextMessage';
import { ValidationError } from '../../src/errors';

describe('TextMessage', () => {
  describe('constructor', () => {
    it('should create a text message with options', () => {
      const message = new TextMessage({ body: 'Hello World' });
      expect(message.props.body).toBe('Hello World');
    });

    it('should create a text message without options', () => {
      const message = new TextMessage();
      expect(message.props.body).toBeUndefined();
    });
  });

  describe('setBody', () => {
    it('should set the message body', () => {
      const message = new TextMessage();
      const result = message.setBody('Test message');

      expect(message.props.body).toBe('Test message');
      expect(result).toBe(message); // Should return this for chaining
    });

    it('should throw ValidationError for empty body', () => {
      const message = new TextMessage();

      expect(() => message.setBody('')).toThrow(ValidationError);
      expect(() => message.setBody('   ')).toThrow(ValidationError);
    });

    it('should throw ValidationError for null/undefined body', () => {
      const message = new TextMessage();

      expect(() => message.setBody(null as unknown as string)).toThrow(ValidationError);
      expect(() => message.setBody(undefined as unknown as string)).toThrow(ValidationError);
    });
  });

  describe('toJSON', () => {
    it('should return correct JSON structure', () => {
      const message = new TextMessage({ body: 'Hello World' });
      expect(message.toJSON()).toEqual({ type: 'text', text: { body: 'Hello World' } });
    });

    it('should handle message without body', () => {
      const message = new TextMessage();
      expect(message.toJSON()).toEqual({ type: 'text', text: {} });
    });
  });
});
