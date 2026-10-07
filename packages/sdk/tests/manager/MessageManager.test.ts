import { MessageManager } from '../../src/manager/MessageManager';
import { Sender, WhatsappClient } from '../../src/client';
import { TextMessage } from '../../src/structures/TextMessage';
import { SenderNotFoundError, ValidationError } from '../../src/errors';

// Mock the REST client
const mockRestClient = {
  request: jest.fn(),
};

// Mock the WhatsApp client
const createMockClient = (senderConfig: Sender | Sender[]) => ({
  options: {
    sender: senderConfig,
  },
  rest: mockRestClient,
});

describe('MessageManager', () => {
  let messageManager: MessageManager;
  let mockClient: WhatsappClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSender', () => {
    it('should return single sender when configured', () => {
      const singleSender = {
        name: 'Test',
        number: '15550001111',
        numberID: 'test-id',
        default: true,
        token: 'test-token',
      };

      mockClient = createMockClient(singleSender) as unknown as WhatsappClient;
      messageManager = new MessageManager(mockClient);

      const sender = messageManager.getSender({ message: new TextMessage() });
      expect(sender).toBe(singleSender);
    });

    it('should return sender by name when multiple senders configured', () => {
      const senders = [
        {
          name: 'Support',
          number: '15550001111',
          numberID: 'support-id',
          default: true,
          token: 'support-token',
        },
        {
          name: 'Sales',
          number: '15550002222',
          numberID: 'sales-id',
          default: false,
          token: 'sales-token',
        },
      ];

      mockClient = createMockClient(senders) as unknown as WhatsappClient;
      messageManager = new MessageManager(mockClient);

      const sender = messageManager.getSender({
        message: new TextMessage(),
        from: 'Sales',
      });
      expect(sender).toBe(senders[1]);
    });

    it('should return sender by number when multiple senders configured', () => {
      const senders = [
        {
          name: 'Support',
          number: '15550001111',
          numberID: 'support-id',
          default: true,
          token: 'support-token',
        },
        {
          name: 'Sales',
          number: '15550002222',
          numberID: 'sales-id',
          default: false,
          token: 'sales-token',
        },
      ];

      mockClient = createMockClient(senders) as unknown as WhatsappClient;
      messageManager = new MessageManager(mockClient);

      const sender = messageManager.getSender({
        message: new TextMessage(),
        from: '15550002222',
      });
      expect(sender).toBe(senders[1]);
    });

    it('should return default sender when no from specified', () => {
      const senders = [
        {
          name: 'Support',
          number: '15550001111',
          numberID: 'support-id',
          default: true,
          token: 'support-token',
        },
        {
          name: 'Sales',
          number: '15550002222',
          numberID: 'sales-id',
          default: false,
          token: 'sales-token',
        },
      ];

      mockClient = createMockClient(senders) as unknown as WhatsappClient;
      messageManager = new MessageManager(mockClient);

      const sender = messageManager.getSender({ message: new TextMessage() });
      expect(sender).toBe(senders[0]);
    });
  });

  describe('getAuthor', () => {
    it('should return author information for valid sender', () => {
      const sender = {
        name: 'Test',
        number: '15550001111',
        numberID: 'test-id',
        default: true,
        token: 'test-token',
      };

      mockClient = createMockClient(sender) as unknown as WhatsappClient;
      messageManager = new MessageManager(mockClient);

      const author = messageManager.getAuthor({ message: new TextMessage() });
      expect(author).toEqual({
        id: 'test-id',
        author: '15550001111',
        token: 'test-token',
      });
    });

    it('should throw SenderNotFoundError when no sender found', () => {
      const senders = [
        {
          name: 'Support',
          number: '15550001111',
          numberID: 'support-id',
          default: false,
          token: 'support-token',
        },
      ];

      mockClient = createMockClient(senders) as unknown as WhatsappClient;
      messageManager = new MessageManager(mockClient);

      expect(() => messageManager.getAuthor({ message: new TextMessage() })).toThrow(
        SenderNotFoundError,
      );
    });

    it('should include from info in error message when sender not found', () => {
      const senders = [
        {
          name: 'Support',
          number: '15550001111',
          numberID: 'support-id',
          default: false,
          token: 'support-token',
        },
      ];

      mockClient = createMockClient(senders) as unknown as WhatsappClient;
      messageManager = new MessageManager(mockClient);

      expect(() =>
        messageManager.getAuthor({
          message: new TextMessage(),
          from: 'InvalidSender',
        }),
      ).toThrow('Sender not found: InvalidSender');
    });
  });

  describe('send', () => {
    it('should send message successfully', async () => {
      const sender = {
        name: 'Test',
        number: '15550001111',
        numberID: 'test-id',
        default: true,
        token: 'test-token',
      };

      mockClient = createMockClient(sender) as unknown as WhatsappClient;
      messageManager = new MessageManager(mockClient);

      const message = new TextMessage().setBody('Hello');
      await messageManager.send('15550002222', { message });

      expect(mockRestClient.request).toHaveBeenCalledWith('/message', {
        method: 'POST',
        data: {
          author: '15550001111',
          number: '15550002222',
          id: 'test-id',
          token: 'test-token',
          message: { type: 'text', text: { body: 'Hello' } },
        },
      });
    });

    it('should throw ValidationError for invalid phone number', async () => {
      const sender = {
        name: 'Test',
        number: '15550001111',
        numberID: 'test-id',
        default: true,
        token: 'test-token',
      };

      mockClient = createMockClient(sender) as unknown as WhatsappClient;
      messageManager = new MessageManager(mockClient);

      const message = new TextMessage().setBody('Hello');

      await expect(messageManager.send('123', { message })).rejects.toThrow(ValidationError);
    });

    it('should throw SenderNotFoundError when no sender available', async () => {
      const senders = [
        {
          name: 'Support',
          number: '15550001111',
          numberID: 'support-id',
          default: false,
          token: 'support-token',
        },
      ];

      mockClient = createMockClient(senders) as unknown as WhatsappClient;
      messageManager = new MessageManager(mockClient);

      const message = new TextMessage().setBody('Hello');

      await expect(messageManager.send('15550002222', { message })).rejects.toThrow(
        SenderNotFoundError,
      );
    });
  });
});
