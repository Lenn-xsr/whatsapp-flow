import Flow from './flow.model';
import { FlowLink, FlowNode } from './types';

/** Key of the only link leaving a node that does not offer options. */
export const DEFAULT_LINK = 'default';

/** Answers "where can the conversation go from here?" for a flow graph. */
export class FlowNavigationService {
  constructor(private readonly flow: Flow) {}

  getNode(id: number): FlowNode {
    const node = this.flow.content.nodes.find((node) => node.id === id);
    if (!node) {
      throw new Error(`Node with ID ${id} not found`);
    }
    return node;
  }

  getNextLinks(nodeId: number): FlowLink[] {
    return this.flow.content.links.filter((link) => link.nodes[0]?.id === nodeId);
  }

  /**
   * Maps each way out of a node to the id of the node it leads to.
   *
   * - Interaction nodes have one entry per linked option, keyed by the label
   *   of the option.
   * - Every other node has at most one entry, keyed `default`.
   * - A node without outgoing links yields an empty map: the flow ends there.
   */
  getNextNodeIds(node: FlowNode): Record<string, number> {
    const links = this.getNextLinks(node.id);

    if (node.extra.type !== 'interaction') {
      const target = links[0]?.nodes[1];
      return target ? { [DEFAULT_LINK]: target.id } : {};
    }

    const options = node.extra.value?.action?.value ?? [];
    const next: Record<string, number> = {};

    for (const link of links) {
      const [source, target] = link.nodes;
      if (!source || !target || typeof source.componentIndex !== 'number') continue;

      const option = options[source.componentIndex];
      if (option?.value) {
        next[option.value] = target.id;
      }
    }

    return next;
  }
}
