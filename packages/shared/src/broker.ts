/**
 * RabbitMQ contract between the gateway (publisher) and the flow-engine
 * (consumer). Both sides assert the same topology, so either can start first.
 */

/** Durable direct exchange the gateway publishes inbound messages to. */
export const MESSAGES_EXCHANGE = 'messages';

/** Routing key of a message received from a WhatsApp user. */
export const INBOUND_MESSAGE_ROUTING_KEY = 'message.received';

/** Durable queue the flow-engine consumes, bound with the routing key above. */
export const INBOUND_MESSAGES_QUEUE = 'messages.inbound';

/** Body of the messages published with `INBOUND_MESSAGE_ROUTING_KEY`. */
export interface InboundMessageEvent {
  /** Id the gateway stored the message under. */
  id: string;
  /** Phone number of the WhatsApp user who sent the message. */
  author: string;
  /** Business phone number that received the message. */
  to: string;
  /** When the gateway received the message (ISO 8601). */
  date: string;
  /** The message object exactly as delivered by the WhatsApp Cloud API webhook. */
  message: Record<string, unknown>;
}
