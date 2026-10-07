import { createLogger } from '@whatsapp-flow/shared';
import { ListenerRegistry } from './listener.registry';
import { parseIncomingSocketMessage } from './socket.protocol';

const logger = createLogger('socket.io');

/** The part of a socket.io socket the handler uses. */
export interface ClientSocket {
  id: string;
  on(event: 'message', listener: (frame: unknown) => void): unknown;
  on(event: 'disconnect', listener: () => void): unknown;
}

/** Applies the frames a client sends to the listener registry. */
export class SocketHandler {
  constructor(private readonly registry: ListenerRegistry) {}

  onConnection(socket: ClientSocket): void {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => this.onDisconnect(socket));
    socket.on('message', (frame) => this.onMessage(socket, frame));
  }

  onDisconnect(socket: Pick<ClientSocket, 'id'>): void {
    this.registry.unregisterSocket(socket.id);
    logger.info(`Client disconnected: ${socket.id}`);
  }

  onMessage(socket: Pick<ClientSocket, 'id'>, frame: unknown): void {
    const message = parseIncomingSocketMessage(frame);
    if (!message) {
      logger.warn(`Ignoring malformed frame from ${socket.id}`);
      return;
    }

    switch (message.type) {
      case 'listen_to_message':
        this.registry.register(message.payload, socket.id);
        break;
      case 'message_received':
        this.registry.acknowledge(message.payload.id);
        break;
    }
  }
}
