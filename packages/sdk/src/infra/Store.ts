import { callback, MessageIdentifier, WebsocketMessage } from '../types';

const keyOf = (identifier: MessageIdentifier): string =>
  [identifier.type, identifier.number, identifier.content.toLowerCase()].join('|');

interface Listener {
  identifier: MessageIdentifier;
  callback: callback;
}

/** Keeps the callback registered for each message identifier. */
export class Store {
  private readonly listeners = new Map<string, Listener>();

  addState(identifier: MessageIdentifier, value: callback): void {
    this.listeners.set(keyOf(identifier), { identifier, callback: value });
  }

  identifiers(): MessageIdentifier[] {
    return Array.from(this.listeners.values(), (listener) => listener.identifier);
  }

  /**
   * Runs the callback registered for the identifier carried by the message.
   * @returns whether a callback was found
   */
  executeState(message: WebsocketMessage): boolean {
    const listener = this.listeners.get(keyOf(message.identifier));
    if (!listener) return false;

    listener.callback(message);
    return true;
  }
}
