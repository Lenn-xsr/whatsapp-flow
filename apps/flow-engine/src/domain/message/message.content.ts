const SUPPORTED_TYPES = ['text', 'interactive', 'button'] as const;

/** Inbound message types the engine understands. */
export type MessageType = (typeof SUPPORTED_TYPES)[number];

export function isMessageType(type: unknown): type is MessageType {
  return SUPPORTED_TYPES.includes(type as MessageType);
}

/** A selected reply button or list row. */
export interface InteractiveReply {
  id: string;
  title: string;
}

/**
 * Message object as delivered by the WhatsApp Cloud API webhook, narrowed to
 * the fields the engine reads.
 */
export type MessageContent =
  | {
      type: 'text';
      text: {
        body: string;
      };
    }
  | {
      type: 'interactive';
      interactive: {
        /** `button_reply` or `list_reply`: the key holding the reply. */
        type: string;
        [key: string]: InteractiveReply | string;
      };
    }
  | {
      /** Quick-reply button of a template message. */
      type: 'button';
      button: {
        text: string;
      };
    };
