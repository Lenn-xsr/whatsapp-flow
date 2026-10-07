import * as amqp from 'amqplib';
import {
  INBOUND_MESSAGE_ROUTING_KEY,
  INBOUND_MESSAGES_QUEUE,
  MESSAGES_EXCHANGE,
  createLogger,
} from '@whatsapp-flow/shared';
import Message from '../../domain/message';
import { MessageMapper } from './message.mapper';

const logger = createLogger('amqp');

export type MessageHandler = (message: Message) => Promise<unknown>;

type ConsumerChannel = Pick<amqp.Channel, 'consume' | 'ack' | 'nack'>;

/** Consumes the inbound messages the gateway publishes to RabbitMQ. */
export default class MessageConsumer {
  constructor(private readonly channel: ConsumerChannel) {}

  /**
   * Connects to RabbitMQ and declares the same topology as the gateway.
   * Messages are handled one at a time (prefetch 1), which keeps the
   * messages of a conversation in order.
   */
  static async connect(url: string): Promise<MessageConsumer> {
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();

    await channel.assertExchange(MESSAGES_EXCHANGE, 'direct', { durable: true });
    await channel.assertQueue(INBOUND_MESSAGES_QUEUE, { durable: true });
    await channel.bindQueue(INBOUND_MESSAGES_QUEUE, MESSAGES_EXCHANGE, INBOUND_MESSAGE_ROUTING_KEY);
    await channel.prefetch(1);

    return new MessageConsumer(channel);
  }

  async consume(handler: MessageHandler): Promise<void> {
    await this.channel.consume(INBOUND_MESSAGES_QUEUE, (delivery) => {
      if (!delivery) return;
      void this.handleDelivery(delivery, handler);
    });
  }

  /**
   * Handles one delivery and settles it:
   *
   * - handled: acknowledged;
   * - not a message the engine understands: acknowledged and skipped;
   * - handler failed: rejected without requeue, so a message that always
   *   fails cannot block the queue. The failure is logged and the message is
   *   lost unless the queue has a dead-letter exchange.
   */
  async handleDelivery(delivery: amqp.ConsumeMessage, handler: MessageHandler): Promise<void> {
    let message: Message;

    try {
      message = MessageMapper.toDomain(delivery.content);
    } catch (error) {
      logger.warn('Skipping message that cannot be handled', error);
      this.channel.ack(delivery);
      return;
    }

    try {
      await handler(message);
      this.channel.ack(delivery);
    } catch (error) {
      logger.error(`Failed to handle message ${message.id}`, error);
      this.channel.nack(delivery, false, false);
    }
  }
}
