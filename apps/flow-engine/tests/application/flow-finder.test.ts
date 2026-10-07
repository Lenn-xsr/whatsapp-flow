import { FlowFinder } from '../../src/application/services/flow-finder';
import { SearchKey } from '../../src/domain/flow';
import { InMemoryFlowRepository, InMemoryStateRepository } from '../support/fakes';
import { BUSINESS, CUSTOMER, flow, textNode } from '../support/flows';
import { buttonReply, text } from '../support/messages';

const named = (id: string, search: SearchKey[], number = BUSINESS) =>
  flow([textNode(0, id)], [], { id, search, number });

describe('FlowFinder', () => {
  let flows: InMemoryFlowRepository;
  let states: InMemoryStateRepository;
  let finder: FlowFinder;

  const welcome = named('welcome', [{ type: 'default', value: '' }]);
  const returning = named('returning', [{ type: 'state', value: '' }]);
  const pricing = named('pricing', [{ type: 'contains', value: 'price' }]);
  const support = named('support', [{ type: 'equals', value: 'Support' }]);

  beforeEach(() => {
    flows = new InMemoryFlowRepository([welcome, returning, pricing, support]);
    states = new InMemoryStateRepository();
    finder = new FlowFinder(flows, states);
  });

  it('picks the flow whose keyword matches the message', async () => {
    const found = await finder.findFlow(text('what is the price?'), false);

    expect(found?.id).toBe('pricing');
  });

  it('matches keywords against the title of a tapped button', async () => {
    const found = await finder.findFlow(buttonReply('Support', 'btn-1'), false);

    expect(found?.id).toBe('support');
  });

  it('lets a keyword win over the conversation in progress', async () => {
    states.seed(CUSTOMER, 'welcome');

    const found = await finder.findFlow(text('send me the price list'), false);

    expect(found?.id).toBe('pricing');
  });

  it('continues the flow of the conversation in progress', async () => {
    states.seed(CUSTOMER, 'pricing');

    const found = await finder.findFlow(text('ok thanks'), false);

    expect(found?.id).toBe('pricing');
  });

  it('continues the most recently started conversation when there are several', async () => {
    states.seed(CUSTOMER, 'pricing');
    states.seed(CUSTOMER, 'support');

    const found = await finder.findFlow(text('ok thanks'), false);

    expect(found?.id).toBe('support');
  });

  it('ignores conversations of other users', async () => {
    states.seed('15550003333', 'pricing');

    const found = await finder.findFlow(text('hello'), true);

    expect(found?.id).toBe('welcome');
  });

  it('falls back to the default flow for the first message of a user', async () => {
    const found = await finder.findFlow(text('hello'), true);

    expect(found?.id).toBe('welcome');
  });

  it('falls back to the state flow for a user who wrote before', async () => {
    const found = await finder.findFlow(text('hello again'), false);

    expect(found?.id).toBe('returning');
  });

  it('finds nothing when no keyword matches and there is no fallback flow', async () => {
    flows.flows = [pricing, support];

    expect(await finder.findFlow(text('hello'), true)).toBeUndefined();
    expect(await finder.findFlow(text('hello'), false)).toBeUndefined();
  });

  it('only considers the flows of the number that was contacted', async () => {
    flows.flows = [named('other-number', [{ type: 'default', value: '' }], '15550009999')];

    expect(await finder.findFlow(text('hello'), true)).toBeUndefined();
  });

  it('does not continue a conversation whose flow no longer exists', async () => {
    states.seed(CUSTOMER, 'deleted-flow');

    const found = await finder.findFlow(text('hello'), false);

    expect(found?.id).toBe('returning');
  });
});
