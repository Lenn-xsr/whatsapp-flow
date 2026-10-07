import { MessageIdentifier } from '../../application/ports/message.listener.port';

export interface ListenerMatch {
  /** Id of the socket that subscribed. */
  socketId: string;
  /** The identifier exactly as the socket registered it. */
  identifier: MessageIdentifier;
}

const keyOf = (socketId: string, identifier: MessageIdentifier): string =>
  [socketId, identifier.type, identifier.number, identifier.content.toLowerCase()].join('|');

/**
 * In-memory bookkeeping of the socket.io side:
 * which socket listens to which messages, and which delivered messages are
 * still waiting for the listener to acknowledge them.
 */
export class ListenerRegistry {
  private readonly listeners = new Map<string, ListenerMatch>();
  private readonly pendingAcknowledgements = new Map<string, (acknowledged: boolean) => void>();

  /** Subscribes a socket to the messages matching the identifier. */
  register(identifier: MessageIdentifier, socketId: string): void {
    this.listeners.set(keyOf(socketId, identifier), { socketId, identifier });
  }

  /** Drops every subscription of a socket (it disconnected). */
  unregisterSocket(socketId: string): void {
    for (const [key, listener] of this.listeners) {
      if (listener.socketId === socketId) {
        this.listeners.delete(key);
      }
    }
  }

  /**
   * Finds the first subscription matching a message: same type, same business
   * number and a registered content the message content starts with
   * (case-insensitive).
   */
  find(message: MessageIdentifier): ListenerMatch | undefined {
    const content = message.content.toLowerCase();

    for (const listener of this.listeners.values()) {
      const { identifier } = listener;
      if (
        identifier.type === message.type &&
        identifier.number === message.number &&
        content.startsWith(identifier.content.toLowerCase())
      ) {
        return listener;
      }
    }

    return undefined;
  }

  /**
   * Waits for the listener to acknowledge a delivered message.
   * @returns true when acknowledged, false when `timeoutMs` elapsed first
   */
  waitForAcknowledgement(messageId: string, timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pendingAcknowledgements.delete(messageId);
        resolve(false);
      }, timeoutMs);

      this.pendingAcknowledgements.set(messageId, (acknowledged) => {
        clearTimeout(timer);
        this.pendingAcknowledgements.delete(messageId);
        resolve(acknowledged);
      });
    });
  }

  /** Marks a delivered message as handled by its listener. */
  acknowledge(messageId: string): void {
    this.pendingAcknowledgements.get(messageId)?.(true);
  }
}
