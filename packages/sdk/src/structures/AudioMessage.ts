import { Message } from './Message';
import { validateUrl } from '../utils/Validation';

interface AudioMessageOptions extends Record<string, unknown> {
  link: string;
}

export class AudioMessage extends Message {
  constructor(options?: AudioMessageOptions) {
    super('audio', options);
  }

  /**
   * Sets the audio link URL
   * @param link - The URL of the audio file
   * @returns This instance for method chaining
   * @throws ValidationError if the URL is invalid
   */
  setLink(link: string): this {
    validateUrl(link, 'link');
    this.props.link = link;
    return this;
  }
}
