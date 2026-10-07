import { Message } from './Message';
import { validateUrl, validateRequired } from '../utils/Validation';

interface VideoMessageOptions extends Record<string, unknown> {
  link: string;
  caption?: string;
}

export class VideoMessage extends Message {
  constructor(options?: VideoMessageOptions) {
    super('video', options);
  }

  /**
   * Sets the video link URL
   * @param link - The URL of the video
   * @returns This instance for method chaining
   * @throws ValidationError if the URL is invalid
   */
  setLink(link: string): this {
    validateUrl(link, 'link');
    this.props.link = link;
    return this;
  }

  /**
   * Sets the video caption
   * @param caption - The caption text for the video
   * @returns This instance for method chaining
   * @throws ValidationError if the caption is empty
   */
  setCaption(caption: string): this {
    validateRequired(caption, 'caption');
    this.props.caption = caption;
    return this;
  }
}
