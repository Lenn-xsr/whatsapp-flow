import { Message } from './Message';
import { validateRequired, validateWhatsAppText } from '../utils/Validation';

interface TextMessageOptions extends Record<string, unknown> {
  body: string;
}

/**
 * Plain text message.
 *
 * @example
 * ```typescript
 * const message = new TextMessage().setBody('Hello, World!');
 *
 * await client.messages.send('15550001111', { message });
 * ```
 */
export class TextMessage extends Message {
  constructor(options?: TextMessageOptions) {
    super('text', options);
  }

  /**
   * Sets the message body.
   *
   * @param content - The text of the message (max 4096 characters)
   * @throws ValidationError if the content is empty or exceeds the limit
   */
  setBody(content: string): this {
    validateRequired(content, 'body');
    validateWhatsAppText(content, 'body');
    this.props.body = content;
    return this;
  }
}
