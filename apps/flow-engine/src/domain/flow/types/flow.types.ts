import { NodeExtra } from './node.types';

/**
 * How a flow is selected for an inbound message.
 *
 * - `equals`, `contains`, `startsWith`: keyword triggers compared with the
 *   text the user sent;
 * - `default`: fallback for the first message a user ever sends;
 * - `state`: fallback for later messages when no conversation is in progress.
 */
export type FlowSearchType = 'equals' | 'contains' | 'startsWith' | 'state' | 'default';

export interface SearchKey {
  type: FlowSearchType;
  /** Keyword for the keyword triggers; unused by `default` and `state`. */
  value: string;
}

export interface FlowNode {
  /** Unique within the flow. The node with id 0 is where the flow starts. */
  id: number;
  name: string;
  /** Canvas position, kept for the editor that drew the flow. */
  x: number;
  y: number;
  /** What the node does. */
  extra: NodeExtra;
}

export interface FlowLinkNode {
  id: number;
  /**
   * For the source of a link leaving an interaction node: index of the option
   * (button or list row) this link belongs to. Ignored otherwise.
   */
  componentIndex: number;
}

/** A directed edge: `nodes[0]` is the source, `nodes[1]` the target. */
export interface FlowLink {
  nodes: FlowLinkNode[];
}

export interface FlowContent {
  nodes: FlowNode[];
  links: FlowLink[];
}

export interface FlowProps {
  id: string;
  /** Who created the flow. */
  author: string;
  name: string;
  /** Business phone number the flow answers for. */
  number: string;
  search: SearchKey[];
  content: FlowContent;
}
