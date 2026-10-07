import { FlowOutput } from './output.types';

/** One item of a text node. `value` is the text, template name, media id or delay. */
export interface NodeMessage {
  type: 'text' | 'question' | 'template' | 'delay' | 'audio' | 'video' | 'image' | (string & {});
  value: string;
}

export interface Header {
  /** `text`, `image`, `video` or `document`. */
  type: string;
  /** The header text, or the URL of the media. */
  value: string;
}

export interface Footer {
  text: string;
}

/** One selectable option of an interaction node. */
export interface ActionValue {
  /** Label shown to the user; also the key of the link followed when chosen. */
  value: string;
  /** Description shown under the label (lists only). */
  subtitle?: string;
}

export interface Action {
  /** `list` renders a list menu; anything else renders reply buttons. */
  type: string;
  /** Label of the button that opens the list (lists only). */
  button?: string;
  value: ActionValue[];
}

/**
 * Payload of a node, discriminated by `type`:
 *
 * - `text`: `value.messages` are sent in order;
 * - `interaction`: `value.value` is the body, `value.action` the options;
 * - `delay`: `value.delay` is how long to wait, in seconds.
 */
export interface NodeExtra {
  type: 'text' | 'interaction' | 'delay' | (string & {});
  value: {
    messages?: NodeMessage[];
    delay?: number;
    value?: string;
    header?: Header;
    footer?: Footer;
    action?: Action;
  };
}

/** What processing a node produces. */
export interface NodeResult {
  outputs: FlowOutput[];
  /**
   * Whether the engine moves on to the next node right away instead of
   * waiting for the user to answer.
   */
  autoAdvance: boolean;
}

export interface NodeProcessor {
  canProcess(node: { extra: NodeExtra }): boolean;
  process(node: { extra: NodeExtra }): NodeResult;
}
