import {
  MessageIdentifier,
  MessageListenerPort,
} from '../../application/ports/message.listener.port';
import Message from '../../domain/message';
import { ListenerRegistry } from './listener.registry';
import { OutgoingSocketMessage } from './socket.protocol';

export const DEFAULT_ACKNOWLEDGEMENT_TIMEOUT_MS = 5000;

/** The part of the socket.io server this adapter uses. */
export interface SocketEmitter {
  to(socketId: string): { emit(event: 'message', payload: OutgoingSocketMessage): unknown };
}

/** Delivers inbound messages to the socket.io clients subscribed to them. */
export default class MessageListenerAdapter implements MessageListenerPort {
  constructor(
    private readonly server: SocketEmitter,
    private readonly registry: ListenerRegistry,
    private readonly acknowledgementTimeoutMs = DEFAULT_ACKNOWLEDGEMENT_TIMEOUT_MS,
  ) {}

  async deliver(identifier: MessageIdentifier, message: Message): Promise<boolean> {
    const listener = this.registry.find(identifier);
    if (!listener) return false;

    const acknowledged = this.registry.waitForAcknowledgement(
      message.id,
      this.acknowledgementTimeoutMs,
    );

    this.server.to(listener.socketId).emit('message', {
      id: message.id,
      author: message.author,
      to: message.to,
      content: message.message,
      // The identifier the client registered, so it can find its callback.
      identifier: listener.identifier,
    });

    return acknowledged;
  }
}
