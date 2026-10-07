import Message from '../../domain/message';

/** Shape of a stored message in HTTP responses. */
export interface MessageResponse {
  id: string;
  author: string;
  to: string;
  date: string;
  message: Record<string, unknown>;
}

export class MessageMapper {
  static toJSON(message: Message): MessageResponse {
    return {
      id: message.id,
      author: message.author,
      to: message.to,
      date: message.date.toISOString(),
      message: message.message,
    };
  }
}
