import Message from '../../domain/message';
import { MessageModelType } from './message.model';

/** Converts between the domain entity and its MongoDB document. */
export class MessageDocumentMapper {
  static toDomain(data: MessageModelType): Message {
    return Message.create({
      id: data._id,
      author: data.author,
      to: data.to,
      date: data.date,
      message: data.message as Record<string, unknown>,
    });
  }

  static fromDomain(entity: Message): MessageModelType {
    return {
      _id: entity.id,
      author: entity.author,
      to: entity.to,
      date: entity.date,
      message: entity.message,
    };
  }
}
