import { InteractiveReply, MessageContent, isMessageType } from './message.content';

export * from './message.content';

export interface MessageProps {
  id: string;
  /** Phone number of the WhatsApp user who sent the message. */
  author: string;
  /** Business phone number that received the message. */
  to: string;
  date: Date;
  message: MessageContent;
}

/** A message received from a WhatsApp user. */
export default class Message implements MessageProps {
  private constructor(public readonly props: MessageProps) {}

  get id() {
    return this.props.id;
  }
  get author() {
    return this.props.author;
  }
  get to() {
    return this.props.to;
  }
  get date() {
    return this.props.date;
  }
  get message() {
    return this.props.message;
  }

  /** The selected button or list row of an interactive reply, if any. */
  get interactiveReply(): InteractiveReply | undefined {
    const { message } = this.props;
    if (message.type !== 'interactive') return undefined;

    const reply = message.interactive?.[message.interactive.type];
    return typeof reply === 'object' && reply !== null ? reply : undefined;
  }

  /**
   * What the user answered, as text: the body of a text message or the title
   * of the button / list row that was selected.
   */
  get response(): string {
    const { message } = this.props;
    switch (message.type) {
      case 'text':
        return message.text?.body ?? '';
      case 'interactive':
        return this.interactiveReply?.title ?? '';
      case 'button':
        return message.button?.text ?? '';
      default:
        return '';
    }
  }

  /** @throws if the message type is not one the engine understands */
  static create(props: MessageProps): Message {
    const type: unknown = props.message?.type;
    if (!isMessageType(type)) {
      throw new Error(`Unsupported message type: ${String(type)}`);
    }

    return new Message(props);
  }
}
