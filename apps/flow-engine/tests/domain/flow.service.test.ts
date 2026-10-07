import { FlowService, Stage } from '../../src/domain/flow';
import { StateStep } from '../../src/domain/state';
import { buttonsNode, delayNode, flow, link, question, textNode } from '../support/flows';

const step = (next: string, response = ''): StateStep => ({ next, response });

/** The texts a stage sends, ignoring other kinds of output. */
const textsOf = (stage: Stage): string[] =>
  stage.outputs.flatMap((output) => (output.kind === 'text' ? [output.text] : []));

describe('FlowService', () => {
  // 0 greeting -> 1 menu -+-> 2 "sales" -> 4 delay -> 5 "bye"
  //                       +-> 3 "support" (asks a question) -> 5 "bye"
  const graph = flow(
    [
      textNode(0, 'Welcome'),
      buttonsNode(1, 'What do you need?', 'Sales', 'Support'),
      textNode(2, 'Sales it is'),
      textNode(3, question('What is the problem?')),
      delayNode(4, 2),
      textNode(5, 'Bye'),
    ],
    [link(0, 1), link(1, 2, 0), link(1, 3, 1), link(2, 4), link(3, 5), link(4, 5)],
  );

  describe('start', () => {
    it('begins at the node with id 0', () => {
      const stage = new FlowService(graph).start();

      expect(stage.nodeId).toBe(0);
      expect(textsOf(stage)).toEqual(['Welcome']);
    });

    it('begins at node 0 wherever it sits in the node list', () => {
      const shuffled = flow([textNode(7, 'Later'), textNode(0, 'First')], [link(0, 7)]);

      expect(textsOf(new FlowService(shuffled).start())).toEqual(['First']);
    });

    it('fails when the flow has no node 0', () => {
      const headless = flow([textNode(1, 'Orphan')]);

      expect(() => new FlowService(headless).start()).toThrow('Node with ID 0 not found');
    });

    it('returns the same stage every time it is called', () => {
      const service = new FlowService(graph);
      service.getStage([step('default'), step('Sales', 'Sales')]);

      expect(service.start().nodeId).toBe(0);
      expect(service.start().nodeId).toBe(0);
    });
  });

  describe('stages', () => {
    it('offers one way out of a text node, keyed "default"', () => {
      const stage = new FlowService(graph).start();

      expect(Object.keys(stage.next)).toEqual(['default']);
      expect(stage.next.default?.().nodeId).toBe(1);
    });

    it('offers one way out of an interaction node per option', () => {
      const menu = new FlowService(graph).getStage([step('default')]);

      expect(Object.keys(menu.next)).toEqual(['Sales', 'Support']);
      expect(textsOf(menu.next.Sales!())).toEqual(['Sales it is']);
      expect(textsOf(menu.next.Support!())).toEqual(['What is the problem?']);
    });

    it('marks which stages continue without waiting for the user', () => {
      const service = new FlowService(graph);

      expect(service.start().autoAdvance).toBe(true);
      expect(service.getStage([step('default')]).autoAdvance).toBe(false);
      expect(service.getStage([step('default'), step('Support')]).autoAdvance).toBe(false);
      expect(service.getStage([step('default'), step('Sales'), step('default')]).autoAdvance).toBe(
        true,
      );
    });

    it('has no way out of the last node', () => {
      const last = new FlowService(graph).getStage([
        step('default'),
        step('Support'),
        step('default'),
      ]);

      expect(last.nodeId).toBe(5);
      expect(last.next).toEqual({});
    });

    it('fails for a node type no processor handles', () => {
      const unknown = flow([{ id: 0, name: 'x', x: 0, y: 0, extra: { type: 'poll', value: {} } }]);

      expect(() => new FlowService(unknown).start()).toThrow(
        'No processor found for node type: poll',
      );
    });
  });

  describe('getStage', () => {
    it('is at the start when no step was taken', () => {
      expect(new FlowService(graph).getStage([]).nodeId).toBe(0);
    });

    it('replays the steps taken from the start', () => {
      const service = new FlowService(graph);

      expect(service.getStage([step('default')]).nodeId).toBe(1);
      expect(service.getStage([step('default'), step('Sales')]).nodeId).toBe(2);
      expect(service.getStage([step('default'), step('Sales'), step('default')]).nodeId).toBe(4);
    });

    it('gives the same answer when asked twice', () => {
      const service = new FlowService(graph);
      const steps = [step('default'), step('Support')];

      expect(service.getStage(steps).nodeId).toBe(3);
      expect(service.getStage(steps).nodeId).toBe(3);
    });

    it('stays put on a step whose link no longer exists', () => {
      const service = new FlowService(graph);

      expect(service.getStage([step('default'), step('Billing')]).nodeId).toBe(1);
    });

    it('does not move past the end of the flow', () => {
      const short = flow([textNode(0, 'Only')]);

      expect(new FlowService(short).getStage([step('default'), step('default')]).nodeId).toBe(0);
    });
  });

  describe('cyclic flows', () => {
    // 0 menu -> "Again" loops back to 0, "Stop" ends at 1
    const loop = flow(
      [buttonsNode(0, 'Again or stop?', 'Again', 'Stop'), textNode(1, 'Stopped')],
      [link(0, 0, 0), link(0, 1, 1)],
    );

    it('can be walked without resolving the whole graph', () => {
      const service = new FlowService(loop);

      expect(service.start().nodeId).toBe(0);
      expect(service.getStage([step('Again'), step('Again'), step('Again')]).nodeId).toBe(0);
      expect(service.getStage([step('Again'), step('Stop')]).nodeId).toBe(1);
    });
  });

  describe('options', () => {
    it('fills placeholders with the given variables', () => {
      const personalised = flow([textNode(0, 'Hi ${name}')]);
      const service = new FlowService(personalised, { vars: { name: 'Ana' } });

      expect(textsOf(service.start())).toEqual(['Hi Ana']);
    });

    it('resolves media under the given base URL and the flow id', () => {
      const withMedia = flow([textNode(0, { type: 'image', value: 'logo.png' })], [], {
        id: 'flow-9',
      });
      const service = new FlowService(withMedia, { mediaBaseUrl: 'https://media.example.com' });

      expect(service.start().outputs).toEqual([
        { kind: 'media', mediaType: 'image', url: 'https://media.example.com/flow-9/logo.png' },
      ]);
    });
  });
});
