import Flow, {
  ActionValue,
  FlowLink,
  FlowNode,
  FlowProps,
  NodeExtra,
  NodeMessage,
} from '../../src/domain/flow';

export const BUSINESS = '15550001111';
export const CUSTOMER = '15550002222';

const node = (id: number, extra: NodeExtra): FlowNode => ({
  id,
  name: `node-${id}`,
  x: 0,
  y: 0,
  extra,
});

/** A text node sending the given messages; plain strings are text messages. */
export const textNode = (id: number, ...messages: Array<string | NodeMessage>): FlowNode =>
  node(id, {
    type: 'text',
    value: {
      messages: messages.map((message) =>
        typeof message === 'string' ? { type: 'text', value: message } : message,
      ),
    },
  });

export const question = (value: string): NodeMessage => ({ type: 'question', value });

/** An interaction node offering reply buttons. */
export const buttonsNode = (id: number, text: string, ...options: string[]): FlowNode =>
  node(id, {
    type: 'interaction',
    value: {
      value: text,
      action: { type: 'button', value: options.map((value) => ({ value })) },
    },
  });

/** An interaction node offering a list menu. */
export const listNode = (
  id: number,
  text: string,
  button: string,
  ...options: ActionValue[]
): FlowNode =>
  node(id, {
    type: 'interaction',
    value: { value: text, action: { type: 'list', button, value: options } },
  });

export const delayNode = (id: number, delay: number): FlowNode =>
  node(id, { type: 'delay', value: { delay } });

/**
 * A link from one node to another. `option` is the index of the option the
 * link belongs to when the source is an interaction node.
 */
export const link = (from: number, to: number, option = 0): FlowLink => ({
  nodes: [
    { id: from, componentIndex: option },
    { id: to, componentIndex: 0 },
  ],
});

export const flow = (
  nodes: FlowNode[],
  links: FlowLink[] = [],
  overrides: Partial<FlowProps> = {},
): Flow =>
  Flow.create({
    id: 'flow-1',
    author: 'admin',
    name: 'Test flow',
    number: BUSINESS,
    search: [{ type: 'default', value: '' }],
    content: { nodes, links },
    ...overrides,
  });
