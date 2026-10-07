import Message from '../../domain/message';

export default interface MessageRepositoryPort {
  generateId(): string;
  create(message: Message): Promise<Message>;
  /** Messages written by `author` to `to`, newest first, at most `limit`. */
  getLastMessages(author: string, to: string, limit: number): Promise<Message[]>;
}
