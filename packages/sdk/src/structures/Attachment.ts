import { Message } from './Message';
import { UnsupportedMessageTypeError } from '../errors';
import { validateUrl, validateRequired } from '../utils/Validation';

export type AttachmentType = 'audio' | 'image' | 'video' | 'document';

interface AttachmentOptions extends Record<string, unknown> {
  link: string;
  caption?: string;
  filename?: string;
}

export class Attachment extends Message {
  private readonly attachmentType: AttachmentType;

  constructor(type: AttachmentType, options?: AttachmentOptions) {
    super(type, options);
    this.attachmentType = type;
  }

  /**
   * Sets the attachment link URL
   * @param link - The URL of the attachment
   * @returns This instance for method chaining
   * @throws ValidationError if the URL is invalid
   */
  setLink(link: string): this {
    validateUrl(link, 'link');
    this.props.link = link;
    return this;
  }

  /**
   * Sets the attachment caption
   * @param caption - The caption text for the attachment
   * @returns This instance for method chaining
   * @throws UnsupportedMessageTypeError if caption is not supported for this attachment type
   * @throws ValidationError if the caption is empty
   */
  setCaption(caption: string): this {
    if (this.attachmentType === 'audio') {
      throw new UnsupportedMessageTypeError('Caption is not supported for audio attachments');
    }

    validateRequired(caption, 'caption');
    this.props.caption = caption;
    return this;
  }

  /**
   * Sets the attachment filename
   * @param filename - The filename for the attachment
   * @returns This instance for method chaining
   * @throws UnsupportedMessageTypeError if filename is not supported for this attachment type
   * @throws ValidationError if the filename is empty
   */
  setFilename(filename: string): this {
    if (this.attachmentType !== 'document') {
      throw new UnsupportedMessageTypeError('Filename is only supported for document attachments');
    }

    validateRequired(filename, 'filename');
    this.props.filename = filename;
    return this;
  }
}
