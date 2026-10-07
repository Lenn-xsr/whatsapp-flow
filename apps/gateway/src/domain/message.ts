export interface MessageProps {
  id: string;
  /** Phone number that wrote the message. */
  author: string;
  /** Phone number the message was sent to. */
  to: string;
  date: Date;
  /** WhatsApp Cloud API message object, stored as received or as sent. */
  message: Record<string, unknown>;
}

/**
 * A WhatsApp message that went through the gateway, in either direction:
 * inbound messages have the WhatsApp user as author, outbound messages have
 * the business number as author.
 */
export default class Message implements MessageProps {
  constructor(public readonly props: MessageProps) {}

  get id(): string {
    return this.props.id;
  }
  get author(): string {
    return this.props.author;
  }
  get to(): string {
    return this.props.to;
  }
  get date(): Date {
    return this.props.date;
  }
  get message(): Record<string, unknown> {
    return this.props.message;
  }

  static create(props: MessageProps): Message {
    return new Message(props);
  }
}
