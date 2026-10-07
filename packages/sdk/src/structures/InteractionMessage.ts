import { Message } from './Message';

export type interactiveType = 'button' | 'list';
export type headerType = 'text' | 'image' | 'video' | 'document';

export interface InteractionMessageOptions {
  text?: string | undefined;
  type: interactiveType;
}

/**
 * Base class for interactive messages (reply buttons and list menus).
 * Subclasses fill in the `action` object.
 */
export abstract class InteractionMessage extends Message {
  constructor(options: InteractionMessageOptions) {
    super('interactive', {
      type: options.type,
      body: {
        text: options.text,
      },
    });
  }

  setText(text: string) {
    (this.props.body as Record<string, unknown>).text = text;
    return this;
  }

  setFooter(text: string) {
    this.props.footer = {
      text: text,
    };
    return this;
  }

  /**
   * Sets the header. For `text` the content is the header text, for media
   * types it is the public URL of the media.
   */
  setHeader(type: headerType, content: string) {
    if (type === 'text') {
      this.props.header = {
        type,
        text: content,
      };
    } else {
      this.props.header = {
        type: type,
        [type]: {
          link: content,
        },
      };
    }

    return this;
  }
}
