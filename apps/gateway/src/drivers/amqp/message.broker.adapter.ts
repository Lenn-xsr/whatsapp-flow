import * as amqp from 'amqplib';
import {
  INBOUND_MESSAGE_ROUTING_KEY,
  INBOUND_MESSAGES_QUEUE,
  InboundMessageEvent,
  MESSAGES_EXCHANGE,
} from '@whatsapp-flow/shared';
import MessageBrokerPort from '../../application/ports/message.broker.port';
import Message from '../../domain/message';

/** Serializes a stored message into the event the flow-engine consumes. */
export function toInboundMessageEvent(message: Message): InboundMessageEvent {
  return {
    id: message.id,
    author: message.author,
    to: message.to,
    date: message.date.toISOString(),
    message: message.message,
  };
}

/** Publishes inbound messages to RabbitMQ as persistent JSON messages. */
export default class MessageBrokerAdapter implements MessageBrokerPort {
  constructor(private readonly channel: Pick<amqp.Channel, 'publish'>) {}

  /**
   * Connects to RabbitMQ and declares the exchange, the queue and their
   * binding, so messages are kept even if the flow-engine has never started.
   */
  static async connect(url: string): Promise<MessageBrokerAdapter> {
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();

    await channel.assertExchange(MESSAGES_EXCHANGE, 'direct', { durable: true });
    await channel.assertQueue(INBOUND_MESSAGES_QUEUE, { durable: true });
    await channel.bindQueue(INBOUND_MESSAGES_QUEUE, MESSAGES_EXCHANGE, INBOUND_MESSAGE_ROUTING_KEY);

    return new MessageBrokerAdapter(channel);
  }

  async publishMessage(message: Message): Promise<void> {
    const body = Buffer.from(JSON.stringify(toInboundMessageEvent(message)));

    this.channel.publish(MESSAGES_EXCHANGE, INBOUND_MESSAGE_ROUTING_KEY, body, {
      persistent: true,
      contentType: 'application/json',
    });
  }
}
