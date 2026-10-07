import mongoose from 'mongoose';
import MessageRepositoryPort from '../../application/ports/message.repository.port';
import Message from '../../domain/message';
import { MessageDocumentMapper } from './message.mapper';
import { MessageModel } from './message.model';

export default class MessageRepositoryAdapter implements MessageRepositoryPort {
  generateId(): string {
    return new mongoose.Types.ObjectId().toString();
  }

  async create(message: Message): Promise<Message> {
    await MessageModel.create(MessageDocumentMapper.fromDomain(message));
    return message;
  }

  async getLastMessages(author: string, to: string, limit: number): Promise<Message[]> {
    const documents = await MessageModel.find({ author, to })
      .sort({ date: -1 })
      .limit(limit)
      .lean();
    return documents.map((document) => MessageDocumentMapper.toDomain(document));
  }
}
