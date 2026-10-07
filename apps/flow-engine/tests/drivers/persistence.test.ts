import { readFileSync } from 'fs';
import { join } from 'path';
import { Conversation } from '../../src/application/services/conversation';
import { toHistoryEntry } from '../../src/drivers/gateway/message.history.adapter';
import { FlowMapper } from '../../src/drivers/mongoose/flow.mapper';
import { FlowDocument, FlowModel } from '../../src/drivers/mongoose/flow.model';
import { StateModel } from '../../src/drivers/mongoose/state.model';
import { InMemoryStateRepository } from '../support/fakes';
import { buttonReply, text } from '../support/messages';

const exampleFlow = (): FlowDocument =>
  JSON.parse(readFileSync(join(__dirname, '../../examples/welcome-flow.json'), 'utf8'));

/**
 * Mongoose validates and casts documents without a database connection, which
 * is enough to check that the schemas accept the documented shapes.
 */
describe('flow documents', () => {
  it('accepts the example flow', () => {
    const document = new FlowModel(exampleFlow());

    expect(document.validateSync()).toBeUndefined();
  });

  it('keeps the flow intact through the schema', () => {
    const stored = new FlowModel(exampleFlow()).toObject() as FlowDocument;

    expect(stored.search).toEqual(exampleFlow().search);
    expect(stored.content.nodes).toEqual(exampleFlow().content.nodes);
    expect(stored.content.links).toEqual(exampleFlow().content.links);
  });

  it('requires the number the flow answers for', () => {
    const { number: _number, ...withoutNumber } = exampleFlow();

    expect(new FlowModel(withoutNumber).validateSync()?.errors).toHaveProperty('number');
  });

  it('maps a stored flow to a flow the engine can run', async () => {
    const stored = new FlowModel(exampleFlow()).toObject() as FlowDocument;
    const flow = FlowMapper.toDomain(stored);
    const conversation = new Conversation(new InMemoryStateRepository());

    expect(flow.id).toBe('welcome-flow');
    expect(flow.hasSearchType('default')).toBe(true);
    expect(flow.matches('menu')).toBe(true);

    const greeting = await conversation.respond(text('hi'), flow);
    expect(greeting.map((output) => output.kind)).toEqual(['text', 'interaction']);

    const askName = await conversation.respond(buttonReply('Talk to us'), flow);
    expect(askName).toEqual([{ kind: 'text', text: 'Sure. What is your name?' }]);

    const handoff = await conversation.respond(text('Ana'), flow);
    expect(handoff).toEqual([
      { kind: 'delay', seconds: 2 },
      { kind: 'text', text: 'Thanks! Someone from our team will message you shortly.' },
    ]);
  });
});

describe('conversation state documents', () => {
  it('accepts a state with automatic and answered steps', () => {
    const document = new StateModel({
      _id: 'state-1',
      flowId: 'welcome-flow',
      number: '15550002222',
      steps: [
        { next: 'default', response: '' },
        { next: 'Talk to us', response: 'Talk to us' },
      ],
    });

    expect(document.validateSync()).toBeUndefined();
    expect(document.toObject().steps).toEqual([
      { next: 'default', response: '' },
      { next: 'Talk to us', response: 'Talk to us' },
    ]);
  });

  it('requires the flow and the user the state belongs to', () => {
    const errors = new StateModel({ _id: 'state-1' }).validateSync()?.errors;

    expect(errors).toHaveProperty('flowId');
    expect(errors).toHaveProperty('number');
  });
});

describe('toHistoryEntry', () => {
  it('keeps the type and body of a stored text message', () => {
    const stored = { id: 'm1', message: { type: 'text', text: { body: 'hello' } } };

    expect(toHistoryEntry(stored)).toEqual({ type: 'text', text: 'hello' });
  });

  it('keeps only the type of other messages', () => {
    expect(toHistoryEntry({ message: { type: 'image', image: { id: 'x' } } })).toEqual({
      type: 'image',
    });
  });

  it('tolerates a stored message without content', () => {
    expect(toHistoryEntry({})).toEqual({ type: 'unknown' });
  });
});
