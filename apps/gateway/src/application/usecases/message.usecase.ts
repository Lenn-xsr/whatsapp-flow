import Message from '../../domain/message';
import { RecordMessageDto } from '../dto/message.dto';
import MessageBrokerPort from '../ports/message.broker.port';
import MessageRepositoryPort from '../ports/message.repository.port';

export const MESSAGE_RETRIEVAL_LIMIT = 100;

export default class MessageUseCase {
  constructor(
    private readonly messageRepo: MessageRepositoryPort,
    private readonly messageBroker: MessageBrokerPort,
  ) {}

  /** Stores a message that went through the gateway. */
  async record(dto: RecordMessageDto): Promise<Message> {
    const message = Message.create({
      id: this.messageRepo.generateId(),
      author: dto.author,
      to: dto.to,
      date: new Date(),
      message: dto.message,
    });

    await this.messageRepo.create(message);

    return message;
  }

  /**
   * Handles a message received from a WhatsApp user: stores it, then
   * publishes it so the flow-engine can answer.
   */
  async receive(dto: RecordMessageDto): Promise<Message> {
    const message = await this.record(dto);
    await this.messageBroker.publishMessage(message);
    return message;
  }

  /** Latest messages written by `author` to `to`, newest first. */
  getLastMessages(author: string, to: string): Promise<Message[]> {
    return this.messageRepo.getLastMessages(author, to, MESSAGE_RETRIEVAL_LIMIT);
  }
}
