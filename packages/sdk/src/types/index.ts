/** Inbound message types the flow-engine can route to a socket listener. */
export type MessageType = 'text' | 'interactive' | 'button';

/**
 * Describes which inbound messages a listener wants to receive.
 *
 * - `type`: the inbound message type
 * - `number`: the business phone number that received the message
 * - `content`: prefix matched (case-insensitively) against the text body,
 *   the template button text or the id of the selected button / list row
 */
export interface MessageIdentifier {
  type: MessageType;
  number: string;
  content: string;
}

/** Payload of the `message` event the flow-engine emits to a listener. */
export interface WebsocketMessage {
  id: string;
  /** Phone number of the person who sent the message. */
  author: string;
  /** Business phone number that received it. */
  to: string;
  /** Raw message object as delivered by the WhatsApp Cloud API webhook. */
  content: Record<string, unknown>;
  /** The identifier the listener registered and that matched this message. */
  identifier: MessageIdentifier;
}

export type callback = (message: WebsocketMessage) => void;
