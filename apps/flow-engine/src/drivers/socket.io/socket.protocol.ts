import { MessageIdentifier } from '../../application/ports/message.listener.port';
import { MessageContent, isMessageType } from '../../domain/message';

/**
 * Frames exchanged on the `message` event.
 *
 * Client -> server:
 * - `listen_to_message`: subscribe to the inbound messages matching the payload;
 * - `message_received`: the delivered message with that id was handled.
 */
export type IncomingSocketMessage =
  | { type: 'listen_to_message'; payload: MessageIdentifier }
  | { type: 'message_received'; payload: { id: string } };

/** Server -> client: an inbound message matching one of its subscriptions. */
export interface OutgoingSocketMessage {
  id: string;
  author: string;
  to: string;
  content: MessageContent;
  identifier: MessageIdentifier;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Validates a frame sent by a client; anything else is ignored. */
export function parseIncomingSocketMessage(frame: unknown): IncomingSocketMessage | null {
  if (!isObject(frame) || !isObject(frame.payload)) return null;

  const { type, payload } = frame;

  if (type === 'message_received' && typeof payload.id === 'string') {
    return { type, payload: { id: payload.id } };
  }

  if (
    type === 'listen_to_message' &&
    isMessageType(payload.type) &&
    typeof payload.number === 'string' &&
    typeof payload.content === 'string' &&
    payload.content.length > 0
  ) {
    return {
      type,
      payload: { type: payload.type, number: payload.number, content: payload.content },
    };
  }

  return null;
}
