import { Message } from '../structures/Message';
import { WebsocketMessage } from '../types';
import { MessageManager } from '../manager/MessageManager';

/** An inbound message received over the socket, with a shortcut to answer it. */
export class ReplyMessage {
  constructor(
    private readonly messageManager: MessageManager,
    private readonly websocketMessage: WebsocketMessage,
  ) {}

  /** Phone number of the person who sent the message. */
  get author() {
    return this.websocketMessage.author;
  }

  /** Business phone number that received the message. */
  get to() {
    return this.websocketMessage.to;
  }

  /** Raw message object as delivered by the WhatsApp Cloud API webhook. */
  get content() {
    return this.websocketMessage.content;
  }

  /** Sends `message` back to the author, from the number that was contacted. */
  reply(message: Message) {
    return this.messageManager.send(this.websocketMessage.author, {
      message,
      from: this.websocketMessage.to,
    });
  }

  static create(client: MessageManager, websocketMessage: WebsocketMessage): ReplyMessage {
    return new ReplyMessage(client, websocketMessage);
  }
}
