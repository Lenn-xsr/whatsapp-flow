import { Message } from './Message';
import { validateRequired, validateMediaUrl, validateWhatsAppText } from '../utils/Validation';

interface ImageMessageOptions extends Record<string, unknown> {
  link?: string;
  caption?: string;
}

/**
 * Image message with an optional caption. The image is referenced by a
 * public URL that Meta downloads when delivering the message.
 *
 * @example
 * ```typescript
 * const message = new ImageMessage()
 *   .setLink('https://example.com/image.jpg')
 *   .setCaption('Our new storefront');
 *
 * await client.messages.send('15550001111', { message });
 * ```
 */
export class ImageMessage extends Message {
  constructor(options?: ImageMessageOptions) {
    super('image', options);
  }

  /**
   * Sets the image URL.
   *
   * @throws ValidationError if the URL is invalid or does not look like a media URL
   */
  setLink(url: string): this {
    validateRequired(url, 'link');
    validateMediaUrl(url, 'link');
    this.props.link = url;
    return this;
  }

  /**
   * Sets the image caption.
   *
   * @param caption - The caption text (max 4096 characters)
   * @throws ValidationError if the caption is empty or exceeds the limit
   */
  setCaption(caption: string): this {
    validateRequired(caption, 'caption');
    validateWhatsAppText(caption, 'caption');
    this.props.caption = caption;
    return this;
  }
}
