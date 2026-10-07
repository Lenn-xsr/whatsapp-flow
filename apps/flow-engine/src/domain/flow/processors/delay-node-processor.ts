import { FlowNode, NodeProcessor, NodeResult } from '../types';

/** Pauses the conversation, then moves on to the next node. */
export class DelayNodeProcessor implements NodeProcessor {
  canProcess(node: Pick<FlowNode, 'extra'>): boolean {
    return node.extra.type === 'delay';
  }

  process(node: Pick<FlowNode, 'extra'>): NodeResult {
    const seconds = Number(node.extra.value?.delay);

    return {
      outputs: [{ kind: 'delay', seconds: Number.isFinite(seconds) && seconds > 0 ? seconds : 0 }],
      autoAdvance: true,
    };
  }
}
