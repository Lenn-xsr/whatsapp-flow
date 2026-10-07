import { io, Socket } from 'socket.io-client';
import { callback, MessageIdentifier, WebsocketMessage } from '../types';
import { Store } from '../infra/Store';
import { ConnectionError } from '../errors';
import { getLogger } from '../utils/Logger';

const CONNECT_TIMEOUT_MS = 10000;

/**
 * socket.io client for the flow-engine.
 *
 * Protocol (all frames use the `message` event):
 * - client -> server `{ type: 'listen_to_message', payload: MessageIdentifier }`
 *   registers interest in inbound messages matching the identifier;
 * - server -> client `WebsocketMessage` delivers a matching inbound message;
 * - client -> server `{ type: 'message_received', payload: { id } }` tells the
 *   flow-engine the message was handled, so it does not run a flow for it.
 */
export class WebSocketClient {
  socket: Socket | null = null;
  store: Store;
  private readonly logger = getLogger();

  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {
    this.store = new Store();
  }

  private acknowledge(message: WebsocketMessage): void {
    this.socket?.emit('message', {
      type: 'message_received',
      payload: {
        id: message.id,
      },
    });
  }

  private onMessage(message: WebsocketMessage): void {
    const handled = this.store.executeState(message);
    if (!handled) {
      // Not acknowledging lets the flow-engine fall back to its flows.
      this.logger.warn('Received a message with no registered listener', {
        messageId: message.id,
      });
      return;
    }

    this.acknowledge(message);
    this.logger.debug('Message received and processed', { messageId: message.id });
  }

  private listenTo(identifier: MessageIdentifier): void {
    this.socket?.emit('message', {
      type: 'listen_to_message',
      payload: identifier,
    });
  }

  /**
   * Registers a listener for inbound messages matching the identifier.
   * @throws ConnectionError if the socket is not connected
   */
  registerIdentifier(identifier: MessageIdentifier, callback: callback): void {
    if (!this.socket) {
      throw new ConnectionError('Socket is not connected');
    }

    this.store.addState(identifier, callback);
    this.listenTo(identifier);

    this.logger.debug('Message identifier registered', { identifier });
  }

  /**
   * Connects to the flow-engine socket.io server.
   * @returns Promise that resolves once the first connection is established
   * @throws ConnectionError if the connection is refused or times out
   */
  connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const socket = io(this.url, {
        auth: {
          token: this.token,
        },
        timeout: CONNECT_TIMEOUT_MS,
      });
      this.socket = socket;

      let settled = false;

      socket.on('message', (message: WebsocketMessage) => {
        this.onMessage(message);
      });

      socket.on('connect', () => {
        this.logger.info('Connected to the flow-engine socket');
        // The server forgets listeners when a socket disconnects, so they are
        // registered again on every (re)connection.
        this.store.identifiers().forEach((identifier) => this.listenTo(identifier));

        if (!settled) {
          settled = true;
          resolve();
        }
      });

      socket.on('disconnect', (reason) => {
        this.logger.warn('Disconnected from the flow-engine socket', { reason });
      });

      socket.on('connect_error', (error: Error) => {
        this.logger.error('Failed to connect to the flow-engine socket', error);

        if (!settled) {
          settled = true;
          socket.close();
          this.socket = null;
          reject(new ConnectionError(`WebSocket connection failed: ${error.message}`));
        }
      });
    });
  }

  /** Closes the connection. */
  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }
}
