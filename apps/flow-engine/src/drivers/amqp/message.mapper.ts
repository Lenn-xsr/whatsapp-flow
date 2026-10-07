import { InboundMessageEvent } from '@whatsapp-flow/shared';
import Message, { MessageContent } from '../../domain/message';

export class MessageMapper {
  /**
   * Parses the body of a RabbitMQ message published by the gateway.
   * @throws if the body is not a valid event or carries a message type the
   * engine does not understand (images, audio, locations, ...)
   */
  public static toDomain(content: Buffer): Message {
    const event = JSON.parse(content.toString()) as Partial<InboundMessageEvent>;

    if (!event || typeof event !== 'object') {
      throw new Error('Inbound message event is not an object');
    }

    const { id, author, to, date, message } = event;
    if (typeof id !== 'string' || typeof author !== 'string' || typeof to !== 'string') {
      throw new Error('Inbound message event is missing id, author or to');
    }

    return Message.create({
      id,
      author,
      to,
      date: date ? new Date(date) : new Date(),
      message: message as unknown as MessageContent,
    });
  }
}
