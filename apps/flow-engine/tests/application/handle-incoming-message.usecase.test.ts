import { HistoryEntry } from '../../src/application/ports/message.history.port';
import { Conversation } from '../../src/application/services/conversation';
import { FlowFinder } from '../../src/application/services/flow-finder';
import { DispatchMessageUseCase } from '../../src/application/usecases/dispatch-message.usecase';
import HandleIncomingMessageUseCase, {
  REPEATED_MESSAGES_LIMIT,
} from '../../src/application/usecases/handle-incoming-message.usecase';
import { RunFlowUseCase } from '../../src/application/usecases/run-flow.usecase';
import {
  FakeMessageHistory,
  FakeMessageListeners,
  InMemoryFlowRepository,
  InMemoryStateRepository,
  RecordingMessageSender,
} from '../support/fakes';
import {
  BUSINESS,
  CUSTOMER,
  buttonsNode,
  delayNode,
  flow,
  link,
  question,
  textNode,
} from '../support/flows';
import { buttonReply, text } from '../support/messages';

const textEntry = (body: string): HistoryEntry => ({ type: 'text', text: body });

/**
 * The whole application layer (use cases, flow finder, conversation and the
 * flow domain) wired to in-memory ports.
 */
describe('HandleIncomingMessageUseCase', () => {
  let history: FakeMessageHistory;
  let listeners: FakeMessageListeners;
  let flows: InMemoryFlowRepository;
  let states: InMemoryStateRepository;
  let sender: RecordingMessageSender;
  let sleeps: number[];
  let handle: HandleIncomingMessageUseCase;

  // 0 "Welcome" -> 1 menu -+-> 2 "Open 9 to 6"
  //                        +-> 3 asks name -> 4 wait 2s -> 5 "Thanks"
  const welcome = flow(
    [
      textNode(0, 'Welcome'),
      buttonsNode(1, 'What do you need?', 'Opening hours', 'Talk to us'),
      textNode(2, 'Open 9 to 6'),
      textNode(3, question('What is your name?')),
      delayNode(4, 2),
      textNode(5, 'Thanks, we will call you'),
    ],
    [link(0, 1), link(1, 2, 0), link(1, 3, 1), link(3, 4), link(4, 5)],
    { id: 'welcome', search: [{ type: 'default', value: '' }] },
  );

  const pricing = flow([textNode(0, 'Our plans start at $10')], [], {
    id: 'pricing',
    search: [{ type: 'contains', value: 'price' }],
  });

  beforeEach(() => {
    history = new FakeMessageHistory();
    listeners = new FakeMessageListeners();
    flows = new InMemoryFlowRepository([welcome, pricing]);
    states = new InMemoryStateRepository();
    sender = new RecordingMessageSender();
    sleeps = [];

    handle = new HandleIncomingMessageUseCase(
      history,
      new DispatchMessageUseCase(listeners),
      new RunFlowUseCase(
        new FlowFinder(flows, states),
        new Conversation(states),
        sender,
        async (milliseconds) => {
          sleeps.push(milliseconds);
        },
      ),
    );
  });

  describe('a first-time user', () => {
    beforeEach(() => {
      history.entries = [textEntry('hi')];
    });

    it('is answered by the default flow, in the order of the flow', async () => {
      const outcome = await handle.execute(text('hi'));

      expect(outcome).toBe('answered-by-flow');
      expect(sender.sent.map(({ output }) => output.kind)).toEqual(['text', 'interaction']);
      expect(sender.texts).toEqual(['Welcome']);
    });

    it('gets the answers at their own number, from the number they wrote to', async () => {
      await handle.execute(text('hi'));

      expect(sender.sent.every(({ recipient }) => recipient.to === CUSTOMER)).toBe(true);
      expect(sender.sent.every(({ recipient }) => recipient.from === BUSINESS)).toBe(true);
    });

    it('has their history looked up as author, with the business number as recipient', async () => {
      await handle.execute(text('hi'));

      expect(history.requests).toEqual([{ author: CUSTOMER, to: BUSINESS }]);
    });

    it('is not answered when the number has no default flow', async () => {
      flows.flows = [pricing];

      const outcome = await handle.execute(text('hi'));

      expect(outcome).toBe('unhandled');
      expect(sender.sent).toHaveLength(0);
    });
  });

  describe('a conversation', () => {
    it('advances with each answer until the flow ends', async () => {
      history.entries = [textEntry('hi')];
      await handle.execute(text('hi'));
      sender.clear();

      history.entries = [textEntry('hi')];
      await handle.execute(buttonReply('Talk to us'));
      expect(sender.texts).toEqual(['What is your name?']);
      sender.clear();

      history.entries = [textEntry('Ana'), textEntry('hi')];
      await handle.execute(text('Ana'));
      expect(sender.texts).toEqual(['Thanks, we will call you']);
      expect(states.states).toHaveLength(0);
    });

    it('waits for the delay of the flow before sending what comes after it', async () => {
      states.seed(CUSTOMER, 'welcome', [
        { response: '', next: 'default' },
        { response: 'Talk to us', next: 'Talk to us' },
      ]);
      history.entries = [textEntry('Ana'), textEntry('hi')];

      await handle.execute(text('Ana'));

      expect(sleeps).toEqual([2000]);
      expect(sender.texts).toEqual(['Thanks, we will call you']);
    });

    it('sends nothing when the answer is not one of the options', async () => {
      history.entries = [textEntry('hi')];
      await handle.execute(text('hi'));
      sender.clear();

      history.entries = [textEntry('maybe'), textEntry('hi')];
      const outcome = await handle.execute(text('maybe'));

      expect(outcome).toBe('answered-by-flow');
      expect(sender.sent).toHaveLength(0);
    });

    it('switches to another flow when the message hits its keyword', async () => {
      history.entries = [textEntry('hi')];
      await handle.execute(text('hi'));
      sender.clear();

      history.entries = [textEntry('what is the price?'), textEntry('hi')];
      await handle.execute(text('what is the price?'));

      expect(sender.texts).toEqual(['Our plans start at $10']);
    });
  });

  describe('a returning user without a conversation in progress', () => {
    beforeEach(() => {
      history.entries = [textEntry('hello again'), textEntry('hi')];
    });

    it('is not answered by the default flow', async () => {
      const outcome = await handle.execute(text('hello again'));

      expect(outcome).toBe('unhandled');
      expect(sender.sent).toHaveLength(0);
    });

    it('is answered by the flow with a state trigger', async () => {
      flows.flows.push(
        flow([textNode(0, 'Welcome back')], [], {
          id: 'returning',
          search: [{ type: 'state', value: '' }],
        }),
      );

      await handle.execute(text('hello again'));

      expect(sender.texts).toEqual(['Welcome back']);
    });
  });

  describe('external listeners', () => {
    it('get the message first, and the flow stays out of it when they take it', async () => {
      listeners.subscriptions = ['hi'];
      history.entries = [textEntry('hi')];

      const outcome = await handle.execute(text('hi'));

      expect(outcome).toBe('dispatched');
      expect(sender.sent).toHaveLength(0);
      expect(states.states).toHaveLength(0);
    });

    it('do not prevent the flow from answering a message they did not take', async () => {
      listeners.subscriptions = ['agent'];
      history.entries = [textEntry('hi')];

      const outcome = await handle.execute(text('hi'));

      expect(outcome).toBe('answered-by-flow');
      expect(listeners.offered).toHaveLength(1);
    });
  });

  describe('repetition guard', () => {
    const repeated = (body: string, times: number) =>
      Array.from({ length: times }, () => textEntry(body));

    it('ignores a user whose latest text messages all say the same', async () => {
      listeners.subscriptions = ['hi'];
      history.entries = repeated('hi', REPEATED_MESSAGES_LIMIT);

      const outcome = await handle.execute(text('hi'));

      expect(outcome).toBe('ignored-repetition');
      expect(listeners.offered).toHaveLength(0);
      expect(sender.sent).toHaveLength(0);
    });

    it('answers while the repetition is below the limit', async () => {
      history.entries = repeated('price', REPEATED_MESSAGES_LIMIT - 1);

      expect(await handle.execute(text('price'))).toBe('answered-by-flow');
    });

    it('looks at the most recent messages, not at old ones', async () => {
      history.entries = [textEntry('price'), ...repeated('hi', REPEATED_MESSAGES_LIMIT)];

      expect(await handle.execute(text('price'))).toBe('answered-by-flow');
    });

    it('answers again once the user says something different', async () => {
      history.entries = [
        ...repeated('hi', REPEATED_MESSAGES_LIMIT - 1),
        textEntry('price'),
        ...repeated('hi', 3),
      ];

      expect(await handle.execute(text('hi'))).not.toBe('ignored-repetition');
    });

    it('only counts text messages', async () => {
      history.entries = [
        ...repeated('hi', REPEATED_MESSAGES_LIMIT - 1),
        { type: 'interactive' },
        { type: 'image' },
        textEntry('hi'),
      ];

      expect(await handle.execute(text('hi'))).toBe('ignored-repetition');
    });
  });

  describe('failures', () => {
    it('surfaces a failure to send, so the message is not acknowledged as handled', async () => {
      sender.failure = new Error('gateway unavailable');
      history.entries = [textEntry('hi')];

      await expect(handle.execute(text('hi'))).rejects.toThrow('gateway unavailable');
    });
  });
});
