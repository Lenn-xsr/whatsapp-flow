import { FlowNavigationService } from '../../src/domain/flow';
import { buttonsNode, delayNode, flow, link, textNode } from '../support/flows';

describe('FlowNavigationService', () => {
  const menu = buttonsNode(1, 'Pick', 'Sales', 'Support', 'Billing');
  const graph = flow(
    [textNode(0, 'hi'), menu, textNode(2, 'sales'), textNode(3, 'support'), delayNode(4, 1)],
    [link(0, 1), link(1, 2, 0), link(1, 3, 1), link(2, 4)],
  );
  const navigation = new FlowNavigationService(graph);

  it('finds a node by id', () => {
    expect(navigation.getNode(1)).toBe(menu);
  });

  it('fails for a node that is not part of the flow', () => {
    expect(() => navigation.getNode(99)).toThrow('Node with ID 99 not found');
  });

  it('leads from a text node to the node it is linked to', () => {
    expect(navigation.getNextNodeIds(navigation.getNode(0))).toEqual({ default: 1 });
  });

  it('leads from a delay node to the node it is linked to', () => {
    const delayed = flow([delayNode(0, 1), textNode(1, 'done')], [link(0, 1)]);
    const service = new FlowNavigationService(delayed);

    expect(service.getNextNodeIds(service.getNode(0))).toEqual({ default: 1 });
  });

  it('leads from an interaction node to one node per linked option, keyed by its label', () => {
    expect(navigation.getNextNodeIds(menu)).toEqual({ Sales: 2, Support: 3 });
  });

  it('has no way out of a node without outgoing links', () => {
    expect(navigation.getNextNodeIds(navigation.getNode(3))).toEqual({});
    expect(navigation.getNextNodeIds(navigation.getNode(4))).toEqual({});
  });

  it('ignores links that point at an option the node does not have', () => {
    const broken = flow([buttonsNode(0, 'Pick', 'Only'), textNode(1, 'x')], [link(0, 1, 5)]);
    const service = new FlowNavigationService(broken);

    expect(service.getNextNodeIds(service.getNode(0))).toEqual({});
  });

  it('ignores links without a target', () => {
    const dangling = flow([textNode(0, 'hi')], [{ nodes: [{ id: 0, componentIndex: 0 }] }]);
    const service = new FlowNavigationService(dangling);

    expect(service.getNextNodeIds(service.getNode(0))).toEqual({});
  });
});
