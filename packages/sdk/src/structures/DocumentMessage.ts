import { Message } from './Message';
import { validateUrl, validateRequired } from '../utils/Validation';

interface DocumentMessageOptions extends Record<string, unknown> {
  link: string;
  caption?: string;
  filename?: string;
}

export class DocumentMessage extends Message {
  constructor(options?: DocumentMessageOptions) {
    super('document', options);
  }

  /**
   * Sets the document link URL
   * @param link - The URL of the document
   * @returns This instance for method chaining
   * @throws ValidationError if the URL is invalid
   */
  setLink(link: string): this {
    validateUrl(link, 'link');
    this.props.link = link;
    return this;
  }

  /**
   * Sets the document caption
   * @param caption - The caption text for the document
   * @returns This instance for method chaining
   * @throws ValidationError if the caption is empty
   */
  setCaption(caption: string): this {
    validateRequired(caption, 'caption');
    this.props.caption = caption;
    return this;
  }

  /**
   * Sets the document filename
   * @param filename - The filename for the document
   * @returns This instance for method chaining
   * @throws ValidationError if the filename is empty
   */
  setFilename(filename: string): this {
    validateRequired(filename, 'filename');
    this.props.filename = filename;
    return this;
  }
}
