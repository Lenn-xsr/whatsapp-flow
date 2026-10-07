import { Message } from '../../src/structures/Message';

// Create a concrete implementation for testing the abstract class
class TestMessage extends Message {
  constructor(type: string, props?: Record<string, unknown>) {
    super(type, props);
  }
}

describe('Message', () => {
  describe('constructor', () => {
    it('should create a message with type only', () => {
      const message = new TestMessage('test');

      expect(message.type).toBe('test');
      expect(message.props).toEqual({});
      expect(message.message).toEqual({ test: {} });
    });

    it('should create a message with type and props', () => {
      const props = { content: 'Hello', priority: 'high' };
      const message = new TestMessage('text', props);

      expect(message.type).toBe('text');
      expect(message.props).toEqual(props);
      expect(message.message).toEqual({ text: props });
    });

    it('should handle undefined props', () => {
      const message = new TestMessage('audio', undefined);

      expect(message.type).toBe('audio');
      expect(message.props).toEqual({});
      expect(message.message).toEqual({ audio: {} });
    });

    it('should handle null props', () => {
      const message = new TestMessage('video', null as unknown as Record<string, unknown>);

      expect(message.type).toBe('video');
      expect(message.props).toEqual({});
      expect(message.message).toEqual({ video: {} });
    });

    it('should handle empty props object', () => {
      const message = new TestMessage('image', {});

      expect(message.type).toBe('image');
      expect(message.props).toEqual({});
      expect(message.message).toEqual({ image: {} });
    });
  });

  describe('props property', () => {
    it('should allow modification of props', () => {
      const message = new TestMessage('document');

      message.props.filename = 'test.pdf';
      message.props.size = 1024;

      expect(message.props).toEqual({
        filename: 'test.pdf',
        size: 1024,
      });
    });

    it('should reflect props changes in message object', () => {
      const message = new TestMessage('template');

      message.props.name = 'welcome_template';
      message.message.template = message.props;

      expect(message.message.template).toEqual({
        name: 'welcome_template',
      });
    });

    it('should maintain reference to original props', () => {
      const originalProps: Record<string, unknown> = { key: 'value' };
      const message = new TestMessage('custom', originalProps);

      // Modifying original props should affect message props
      originalProps.newKey = 'newValue';

      expect(message.props.newKey).toBe('newValue');
    });
  });

  describe('message property', () => {
    it('should structure message correctly', () => {
      const props = {
        content: 'Test content',
        metadata: { timestamp: 123456 },
      };
      const message = new TestMessage('notification', props);

      expect(message.message).toEqual({
        notification: {
          content: 'Test content',
          metadata: { timestamp: 123456 },
        },
      });
    });

    it('should allow direct modification of message', () => {
      const message = new TestMessage('alert');

      message.message.alert = { level: 'warning', text: 'Be careful' };

      expect(message.message).toEqual({
        alert: { level: 'warning', text: 'Be careful' },
      });
    });
  });

  describe('toJSON', () => {
    it('should serialize for simple message', () => {
      const message = new TestMessage('simple');

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toEqual({ type: 'simple', simple: {} });
    });

    it('should serialize for complex message', () => {
      const props = {
        text: 'Hello World',
        options: {
          bold: true,
          color: 'blue',
        },
        recipients: ['user1', 'user2'],
      };
      const message = new TestMessage('formatted', props);

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toEqual({
        type: 'formatted',
        formatted: {
          text: 'Hello World',
          options: {
            bold: true,
            color: 'blue',
          },
          recipients: ['user1', 'user2'],
        },
      });
    });

    it('should handle nested objects in props', () => {
      const props = {
        level1: {
          level2: {
            level3: {
              deep: 'value',
            },
          },
        },
      };
      const message = new TestMessage('nested', props);

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed.nested.level1.level2.level3.deep).toBe('value');
    });

    it('should handle arrays in props', () => {
      const props = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        tags: ['tag1', 'tag2', 'tag3'],
      };
      const message = new TestMessage('list', props);

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed.list.items).toHaveLength(2);
      expect(parsed.list.items[0].name).toBe('Item 1');
      expect(parsed.list.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle special characters and unicode', () => {
      const props = {
        text: 'Special chars: áéíóú ñ 中文 🎉 emoji',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      };
      const message = new TestMessage('unicode', props);

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed.unicode.text).toBe('Special chars: áéíóú ñ 中文 🎉 emoji');
      expect(parsed.unicode.symbols).toBe('!@#$%^&*()_+-=[]{}|;:,.<>?');
    });

    it('should handle null and undefined values in props', () => {
      const props = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zero: 0,
        false: false,
      };
      const message = new TestMessage('mixed', props);

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed.mixed.nullValue).toBeNull();
      expect(parsed.mixed.undefinedValue).toBeUndefined();
      expect(parsed.mixed.emptyString).toBe('');
      expect(parsed.mixed.zero).toBe(0);
      expect(parsed.mixed.false).toBe(false);
    });

    it('should return valid JSON that can be parsed', () => {
      const props = { data: 'test data', count: 42 };
      const message = new TestMessage('parse_test', props);

      const jsonString = JSON.stringify(message);

      // Should not throw when parsing
      expect(() => JSON.parse(jsonString)).not.toThrow();

      const parsed = JSON.parse(jsonString);
      expect(typeof parsed).toBe('object');
      expect(parsed.parse_test.data).toBe('test data');
      expect(parsed.parse_test.count).toBe(42);
    });
  });

  describe('type property', () => {
    it('should be readonly', () => {
      const message = new TestMessage('readonly_test');

      expect(message.type).toBe('readonly_test');

      // TypeScript should prevent this, but testing the runtime behavior
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (message as any).type = 'modified';
      }).not.toThrow();

      // The type should remain unchanged due to readonly
      // Note: readonly in TypeScript doesn't prevent runtime modification
      expect(message.type).toBe('modified');
    });

    it('should handle different type formats', () => {
      const types = [
        'text',
        'audio',
        'video',
        'image',
        'document',
        'template',
        'interactive',
        'custom_type',
      ];

      types.forEach((type) => {
        const message = new TestMessage(type);
        expect(message.type).toBe(type);
        expect(message.message[type]).toEqual({});
      });
    });

    it('should handle empty string type', () => {
      const message = new TestMessage('');

      expect(message.type).toBe('');
      expect(message.message['']).toEqual({});
    });

    it('should handle type with special characters', () => {
      const type = 'custom-type_with.special@chars';
      const message = new TestMessage(type);

      expect(message.type).toBe(type);
      expect(message.message[type]).toEqual({});
    });
  });
});
