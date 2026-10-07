import { EventEmitter } from 'events';
import { io } from 'socket.io-client';
import { WebSocketClient } from '../../src/client/Websocket';
import { ConnectionError } from '../../src/errors';
import { MessageIdentifier, WebsocketMessage } from '../../src/types';

jest.mock('socket.io-client', () => ({ io: jest.fn() }));

/** Stands in for the socket.io socket: records what the client sends. */
class FakeSocket extends EventEmitter {
  sent: unknown[] = [];
  closed = false;

  /** Everything the client emits is recorded instead of being dispatched. */
  emit(_event: string, ...args: unknown[]): boolean {
    this.sent.push(args[0]);
    return true;
  }

  /** Simulates an event coming from the server. */
  receive(event: string, payload?: unknown): void {
    super.emit(event, payload);
  }

  close(): void {
    this.closed = true;
  }
}

const identifier: MessageIdentifier = { type: 'text', number: '15550001111', content: 'help' };

const inbound = (matched: MessageIdentifier): WebsocketMessage => ({
  id: 'message-1',
  author: '15550002222',
  to: '15550001111',
  content: { type: 'text', text: { body: 'help' } },
  identifier: matched,
});

describe('WebSocketClient', () => {
  let socket: FakeSocket;
  let client: WebSocketClient;

  const connect = async () => {
    const connecting = client.connect();
    socket.receive('connect');
    await connecting;
  };

  beforeEach(() => {
    socket = new FakeSocket();
    (io as jest.Mock).mockReturnValue(socket);
    client = new WebSocketClient('http://localhost:3001', 'socket-token');
  });

  it('authenticates with the configured token', async () => {
    await connect();

    expect(io).toHaveBeenCalledWith(
      'http://localhost:3001',
      expect.objectContaining({ auth: { token: 'socket-token' } }),
    );
  });

  it('rejects with a ConnectionError when the server refuses the connection', async () => {
    const connecting = client.connect();
    socket.receive('connect_error', new Error('Authentication error'));

    await expect(connecting).rejects.toThrow(ConnectionError);
    expect(socket.closed).toBe(true);
  });

  it('refuses to register a listener before connecting', () => {
    expect(() => client.registerIdentifier(identifier, jest.fn())).toThrow(ConnectionError);
  });

  it('tells the server which messages it wants to receive', async () => {
    await connect();

    client.registerIdentifier(identifier, jest.fn());

    expect(socket.sent).toEqual([{ type: 'listen_to_message', payload: identifier }]);
  });

  it('delivers a matching message to the listener and acknowledges it', async () => {
    await connect();
    const callback = jest.fn();
    client.registerIdentifier(identifier, callback);
    socket.sent = [];

    const message = inbound(identifier);
    socket.receive('message', message);

    expect(callback).toHaveBeenCalledWith(message);
    expect(socket.sent).toEqual([{ type: 'message_received', payload: { id: 'message-1' } }]);
  });

  it('does not acknowledge a message nobody is listening for', async () => {
    await connect();
    client.registerIdentifier(identifier, jest.fn());
    socket.sent = [];

    socket.receive('message', inbound({ ...identifier, content: 'billing' }));

    expect(socket.sent).toEqual([]);
  });

  it('registers its listeners again after a reconnection', async () => {
    await connect();
    client.registerIdentifier(identifier, jest.fn());
    socket.sent = [];

    socket.receive('disconnect', 'transport close');
    socket.receive('connect');

    expect(socket.sent).toEqual([{ type: 'listen_to_message', payload: identifier }]);
  });
});
