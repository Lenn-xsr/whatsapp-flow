import { ClientOptions, WhatsappClient } from '../../src/client';
import { WebSocketClient } from '../../src/client/Websocket';
import { ConnectionError, InitializationError, ValidationError } from '../../src/errors';
import { TextMessage } from '../../src/structures/TextMessage';

jest.mock('../../src/client/Websocket');

const sender = {
  name: 'support',
  number: '15550001111',
  numberID: 'phone-number-id',
  default: true,
  token: 'meta-token',
};

const options = (overrides: Partial<ClientOptions> = {}): ClientOptions => ({
  sender,
  rest: { url: 'http://localhost:3000', token: 'gateway-key' },
  ws: { url: 'ws://localhost:3001', token: 'socket-token' },
  ...overrides,
});

const withoutSocket = (): ClientOptions => ({
  sender,
  rest: { url: 'http://localhost:3000', token: 'gateway-key' },
});

describe('WhatsappClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('configuration', () => {
    it('accepts a configuration without a socket server', () => {
      expect(() => new WhatsappClient(withoutSocket())).not.toThrow();
    });

    it.each(['ws://localhost:3001', 'wss://example.com', 'http://localhost:3001'])(
      'accepts %s as socket URL',
      (url) => {
        expect(
          () => new WhatsappClient(options({ ws: { url, token: 'socket-token' } })),
        ).not.toThrow();
      },
    );

    it('rejects a socket URL with an unsupported protocol', () => {
      expect(
        () => new WhatsappClient(options({ ws: { url: 'ftp://example.com', token: 't' } })),
      ).toThrow(ValidationError);
    });

    it('rejects an invalid gateway URL', () => {
      expect(
        () => new WhatsappClient(options({ rest: { url: 'not-a-url', token: 'gateway-key' } })),
      ).toThrow(ValidationError);
    });

    it('requires a default sender when several are configured', () => {
      expect(
        () => new WhatsappClient(options({ sender: [{ ...sender, default: false }] })),
      ).toThrow('At least one sender must be marked as default');
    });

    it('requires at least one sender', () => {
      expect(() => new WhatsappClient(options({ sender: [] }))).toThrow(ValidationError);
    });
  });

  describe('initialize', () => {
    it('checks the gateway health and connects to the socket server', async () => {
      const client = new WhatsappClient(options());
      const request = jest.spyOn(client.rest, 'request').mockResolvedValue({ status: 'ok' });

      await client.initialize();

      expect(request).toHaveBeenCalledWith('/health', { method: 'GET' });
      expect(WebSocketClient).toHaveBeenCalledWith('ws://localhost:3001', 'socket-token');
      expect(client.websocket).not.toBeNull();
    });

    it('skips the socket when it is not configured', async () => {
      const client = new WhatsappClient(withoutSocket());
      jest.spyOn(client.rest, 'request').mockResolvedValue({ status: 'ok' });

      await client.initialize();

      expect(WebSocketClient).not.toHaveBeenCalled();
      expect(client.websocket).toBeNull();
    });

    it('fails with an InitializationError when the gateway is unreachable', async () => {
      const client = new WhatsappClient(options());
      jest.spyOn(client.rest, 'request').mockRejectedValue(new Error('connect ECONNREFUSED'));

      await expect(client.initialize()).rejects.toThrow(InitializationError);
      expect(client.websocket).toBeNull();
    });
  });

  describe('onMessage', () => {
    const identifier = { type: 'text' as const, number: '15550001111', content: 'help' };

    it('throws when the socket is not connected', () => {
      const client = new WhatsappClient(options());

      expect(() => client.onMessage(identifier, jest.fn())).toThrow(ConnectionError);
    });

    it('hands the listener a message it can reply to from the contacted number', async () => {
      const client = new WhatsappClient(options());
      const request = jest.spyOn(client.rest, 'request').mockResolvedValue(undefined);
      await client.initialize();

      const listener = jest.fn();
      client.onMessage(identifier, listener);

      const registered = (client.websocket!.registerIdentifier as jest.Mock).mock.calls[0];
      expect(registered[0]).toEqual(identifier);

      // Simulate the flow-engine delivering a matching message.
      registered[1]({
        id: 'message-1',
        author: '15550002222',
        to: '15550001111',
        content: { type: 'text', text: { body: 'help' } },
        identifier,
      });

      const received = listener.mock.calls[0][0];
      expect(received.author).toBe('15550002222');

      await received.reply(new TextMessage().setBody('On it'));

      expect(request).toHaveBeenLastCalledWith('/message', {
        method: 'POST',
        data: {
          author: '15550001111',
          number: '15550002222',
          id: 'phone-number-id',
          token: 'meta-token',
          message: { type: 'text', text: { body: 'On it' } },
        },
      });
    });
  });
});
