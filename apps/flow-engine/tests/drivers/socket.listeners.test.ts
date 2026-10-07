import { MessageIdentifier } from '../../src/application/ports/message.listener.port';
import { ListenerRegistry } from '../../src/drivers/socket.io/listener.registry';
import MessageListenerAdapter from '../../src/drivers/socket.io/message.listener.adapter';
import { socketAuth } from '../../src/drivers/socket.io/socket.auth.middleware';
import { SocketHandler } from '../../src/drivers/socket.io/socket.handler';
import { OutgoingSocketMessage } from '../../src/drivers/socket.io/socket.protocol';
import { BUSINESS, CUSTOMER } from '../support/flows';
import { text } from '../support/messages';

const helpListener: MessageIdentifier = { type: 'text', number: BUSINESS, content: 'Help' };
const identifierOf = (content: string): MessageIdentifier => ({
  type: 'text',
  number: BUSINESS,
  content,
});

/** Stands in for the socket.io server: records what is emitted to each socket. */
class FakeSocketServer {
  emitted: Array<{ socketId: string; payload: OutgoingSocketMessage }> = [];

  to(socketId: string) {
    return {
      emit: (_event: 'message', payload: OutgoingSocketMessage) => {
        this.emitted.push({ socketId, payload });
      },
    };
  }
}

describe('socket.io listeners', () => {
  let registry: ListenerRegistry;
  let handler: SocketHandler;
  let server: FakeSocketServer;
  let adapter: MessageListenerAdapter;

  const socket = (id: string) => ({ id });
  const subscribe = (socketId: string, identifier: MessageIdentifier) =>
    handler.onMessage(socket(socketId), { type: 'listen_to_message', payload: identifier });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    registry = new ListenerRegistry();
    handler = new SocketHandler(registry);
    server = new FakeSocketServer();
    adapter = new MessageListenerAdapter(server, registry, 5000);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('matching', () => {
    it('delivers a message to the socket subscribed to it', async () => {
      subscribe('socket-a', helpListener);
      const message = text('help');

      void adapter.deliver(identifierOf('help'), message);

      expect(server.emitted).toEqual([
        {
          socketId: 'socket-a',
          payload: {
            id: message.id,
            author: CUSTOMER,
            to: BUSINESS,
            content: { type: 'text', text: { body: 'help' } },
            identifier: helpListener,
          },
        },
      ]);
    });

    it('matches by prefix and tells the client which subscription matched', async () => {
      subscribe('socket-a', helpListener);

      void adapter.deliver(identifierOf('help me with my order'), text('help me with my order'));

      expect(server.emitted[0]?.payload.identifier).toEqual(helpListener);
    });

    it.each([
      ['another business number', { ...identifierOf('help'), number: '15550009999' }],
      ['another message type', { ...identifierOf('help'), type: 'button' as const }],
      ['content that only contains the keyword', identifierOf('i need help')],
    ])('does not deliver a message for %s', async (_case, identifier) => {
      subscribe('socket-a', helpListener);

      await expect(adapter.deliver(identifier, text('x'))).resolves.toBe(false);
      expect(server.emitted).toHaveLength(0);
    });

    it('reports right away that nobody is listening', async () => {
      await expect(adapter.deliver(identifierOf('help'), text('help'))).resolves.toBe(false);
    });

    it('stops delivering to a socket that disconnected', async () => {
      subscribe('socket-a', helpListener);
      handler.onDisconnect(socket('socket-a'));

      await expect(adapter.deliver(identifierOf('help'), text('help'))).resolves.toBe(false);
    });

    it('keeps the subscriptions of other sockets when one disconnects', async () => {
      subscribe('socket-a', helpListener);
      subscribe('socket-b', { ...helpListener, content: 'billing' });
      handler.onDisconnect(socket('socket-a'));

      void adapter.deliver(identifierOf('billing question'), text('billing question'));

      expect(server.emitted.map(({ socketId }) => socketId)).toEqual(['socket-b']);
    });
  });

  describe('acknowledgement', () => {
    it('resolves true when the client acknowledges the message', async () => {
      subscribe('socket-a', helpListener);
      const message = text('help');

      const delivered = adapter.deliver(identifierOf('help'), message);
      handler.onMessage(socket('socket-a'), {
        type: 'message_received',
        payload: { id: message.id },
      });

      await expect(delivered).resolves.toBe(true);
    });

    it('resolves false when the client does not acknowledge in time', async () => {
      subscribe('socket-a', helpListener);

      const delivered = adapter.deliver(identifierOf('help'), text('help'));
      jest.advanceTimersByTime(5000);

      await expect(delivered).resolves.toBe(false);
    });

    it('ignores an acknowledgement that arrives after the timeout', async () => {
      subscribe('socket-a', helpListener);
      const message = text('help');

      const delivered = adapter.deliver(identifierOf('help'), message);
      jest.advanceTimersByTime(5000);
      handler.onMessage(socket('socket-a'), {
        type: 'message_received',
        payload: { id: message.id },
      });

      await expect(delivered).resolves.toBe(false);
    });

    it('ignores an acknowledgement for a message that was never delivered', () => {
      expect(() =>
        handler.onMessage(socket('socket-a'), {
          type: 'message_received',
          payload: { id: 'unknown' },
        }),
      ).not.toThrow();
    });
  });

  describe('malformed frames', () => {
    it.each([
      ['null', null],
      ['a string', 'listen_to_message'],
      ['an unknown frame type', { type: 'subscribe', payload: helpListener }],
      [
        'a subscription without content',
        { type: 'listen_to_message', payload: { ...helpListener, content: '' } },
      ],
      [
        'a subscription to an unknown message type',
        { type: 'listen_to_message', payload: { ...helpListener, type: 'image' } },
      ],
      ['an acknowledgement without id', { type: 'message_received', payload: {} }],
    ])('ignores %s', async (_case, frame) => {
      expect(() => handler.onMessage(socket('socket-a'), frame)).not.toThrow();

      await expect(adapter.deliver(identifierOf('help'), text('help'))).resolves.toBe(false);
    });
  });
});

describe('socketAuth', () => {
  const authenticate = socketAuth('socket-token');
  const handshake = (auth: Record<string, unknown>) => ({ handshake: { auth } });

  it('lets a connection with the right token through', () => {
    const next = jest.fn();

    authenticate(handshake({ token: 'socket-token' }), next);

    expect(next).toHaveBeenCalledWith();
  });

  it.each([
    ['a wrong token', { token: 'nope' }],
    ['no token', {}],
    ['a token that is not a string', { token: 12345 }],
  ])('refuses a connection with %s', (_case, auth) => {
    const next = jest.fn();

    authenticate(handshake(auth), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Authentication error' }));
  });
});
