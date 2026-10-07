import Message from '../../domain/message';
import { MessageListenerPort } from '../ports/message.listener.port';

/**
 * Offers an inbound message to external listeners (clients connected over
 * socket.io) before the flows get a chance to answer it.
 */
export class DispatchMessageUseCase {
  constructor(private readonly listeners: MessageListenerPort) {}

  /** What listeners match against: text body, button text or selected option id. */
  private extractContent(message: Message): string | undefined {
    switch (message.message.type) {
      case 'button':
        return message.message.button?.text;
      case 'interactive':
        return message.interactiveReply?.id;
      case 'text':
        return message.message.text?.body?.toLowerCase();
      default:
        return undefined;
    }
  }

  /** @returns whether a listener took the message */
  async execute(message: Message): Promise<boolean> {
    const content = this.extractContent(message);
    if (!content) return false;

    return this.listeners.deliver(
      {
        type: message.message.type,
        number: message.to,
        content,
      },
      message,
    );
  }
}
