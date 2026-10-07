import MessageBrokerPort from '../src/application/ports/message.broker.port';
import MessageRepositoryPort from '../src/application/ports/message.repository.port';
import { DeliveryConfig, WhatsappApiPort } from '../src/application/ports/whatsapp.api.port';
import Message from '../src/domain/message';

/** Message repository backed by an array. */
export class InMemoryMessageRepository implements MessageRepositoryPort {
  messages: Message[] = [];
  private sequence = 0;

  generateId(): string {
    this.sequence += 1;
    return `message-${this.sequence}`;
  }

  async create(message: Message): Promise<Message> {
    this.messages.push(message);
    return message;
  }

  async getLastMessages(author: string, to: string, limit: number): Promise<Message[]> {
    return this.messages
      .filter((message) => message.author === author && message.to === to)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }
}

/** Broker that remembers what was published and can be told to fail. */
export class RecordingMessageBroker implements MessageBrokerPort {
  published: Message[] = [];
  failure: Error | null = null;

  async publishMessage(message: Message): Promise<void> {
    if (this.failure) throw this.failure;
    this.published.push(message);
  }
}

/** WhatsApp API that remembers deliveries and can be told to reject them. */
export class FakeWhatsappApi implements WhatsappApiPort {
  deliveries: Array<{ config: DeliveryConfig; message: Record<string, unknown> }> = [];
  failure: Error | null = null;

  async sendMessage(config: DeliveryConfig, message: Record<string, unknown>): Promise<void> {
    if (this.failure) throw this.failure;
    this.deliveries.push({ config, message });
  }
}
