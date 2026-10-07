import { Conversation, MAX_AUTOMATIC_STEPS } from '../../src/application/services/conversation';
import { FlowOutput } from '../../src/domain/flow';
import { InMemoryStateRepository } from '../support/fakes';
import { CUSTOMER, buttonsNode, delayNode, flow, link, question, textNode } from '../support/flows';
import { buttonReply, text } from '../support/messages';

/** Compact view of outputs: texts as strings, the rest by kind. */
const summary = (outputs: FlowOutput[]) =>
  outputs.map((output) => {
    switch (output.kind) {
      case 'text':
        return output.text;
      case 'interaction':
        return `[${output.interactionType}: ${output.options.map((o) => o.title).join(' | ')}]`;
      case 'delay':
        return `[wait ${output.seconds}s]`;
      default:
        return `[${output.kind}]`;
    }
  });

describe('Conversation', () => {
  let states: InMemoryStateRepository;
  let conversation: Conversation;

  beforeEach(() => {
    states = new InMemoryStateRepository();
    conversation = new Conversation(states);
  });

  describe('starting', () => {
    it('answers the first message with the first node', async () => {
      const subject = flow(
        [textNode(0, question('What is your name?')), textNode(1, 'Thanks')],
        [link(0, 1)],
      );

      const outputs = await conversation.respond(text('hi'), subject);

      expect(summary(outputs)).toEqual(['What is your name?']);
      expect(states.stepsOf(CUSTOMER, subject.id)).toEqual([]);
    });

    it('chains the nodes that do not wait for the user', async () => {
      const subject = flow(
        [
          textNode(0, 'Welcome'),
          textNode(1, 'We are open 9 to 6'),
          buttonsNode(2, 'Anything else?', 'Yes', 'No'),
          textNode(3, 'Bye'),
        ],
        [link(0, 1), link(1, 2), link(2, 3, 1)],
      );

      const outputs = await conversation.respond(text('hi'), subject);

      expect(summary(outputs)).toEqual(['Welcome', 'We are open 9 to 6', '[button: Yes | No]']);
    });

    it('remembers the automatic transitions so the next answer lands on the right node', async () => {
      const subject = flow(
        [textNode(0, 'Welcome'), buttonsNode(1, 'Continue?', 'Yes', 'No'), textNode(2, 'Great')],
        [link(0, 1), link(1, 2, 0)],
      );

      await conversation.respond(text('hi'), subject);
      const outputs = await conversation.respond(buttonReply('Yes'), subject);

      expect(summary(outputs)).toEqual(['Great']);
    });
  });

  describe('answering', () => {
    const menu = flow(
      [
        buttonsNode(0, 'Which team?', 'Sales', 'Support'),
        textNode(1, question('What would you like to buy?')),
        textNode(2, question('What is the problem?')),
        textNode(3, 'Thanks, we will get back to you'),
      ],
      [link(0, 1, 0), link(0, 2, 1), link(1, 3), link(2, 3)],
    );

    it('follows the link of the option the user chose', async () => {
      await conversation.respond(text('hi'), menu);

      const outputs = await conversation.respond(buttonReply('Support'), menu);

      expect(summary(outputs)).toEqual(['What is the problem?']);
    });

    it('accepts the option typed as text', async () => {
      await conversation.respond(text('hi'), menu);

      const outputs = await conversation.respond(text('Sales'), menu);

      expect(summary(outputs)).toEqual(['What would you like to buy?']);
    });

    it('stays on the node and sends nothing when the answer is not an option', async () => {
      await conversation.respond(text('hi'), menu);

      const outputs = await conversation.respond(text('neither'), menu);

      expect(outputs).toEqual([]);
      expect(states.stepsOf(CUSTOMER, menu.id)).toEqual([]);

      const retry = await conversation.respond(buttonReply('Sales'), menu);
      expect(summary(retry)).toEqual(['What would you like to buy?']);
    });

    it('accepts any answer to a question and moves on', async () => {
      await conversation.respond(text('hi'), menu);
      await conversation.respond(buttonReply('Support'), menu);

      const outputs = await conversation.respond(text('My order never arrived'), menu);

      expect(summary(outputs)).toEqual(['Thanks, we will get back to you']);
    });

    it('records what the user answered at each step', async () => {
      const longer = flow(
        [
          buttonsNode(0, 'Which team?', 'Sales', 'Support'),
          textNode(1, question('What is the problem?')),
          textNode(2, question('What is your order number?')),
          textNode(3, 'Thanks'),
        ],
        [link(0, 1, 1), link(1, 2), link(2, 3)],
      );

      await conversation.respond(text('hi'), longer);
      await conversation.respond(buttonReply('Support'), longer);
      await conversation.respond(text('It arrived broken'), longer);

      expect(states.stepsOf(CUSTOMER, longer.id)).toEqual([
        { response: 'Support', next: 'Support' },
        { response: 'It arrived broken', next: 'default' },
      ]);
    });

    it('keeps the conversations of different users apart', async () => {
      const other = '15550003333';

      await conversation.respond(text('hi'), menu);
      await conversation.respond(text('hi', other), menu);
      await conversation.respond(buttonReply('Sales'), menu);

      expect(states.stepsOf(CUSTOMER, menu.id)).toHaveLength(1);
      expect(states.stepsOf(other, menu.id)).toEqual([]);
    });
  });

  describe('delays', () => {
    it('passes through a delay node and keeps going', async () => {
      const subject = flow(
        [textNode(0, 'One moment'), delayNode(1, 3), textNode(2, question('Still there?'))],
        [link(0, 1), link(1, 2)],
      );

      const outputs = await conversation.respond(text('hi'), subject);

      expect(summary(outputs)).toEqual(['One moment', '[wait 3s]', 'Still there?']);
    });
  });

  describe('ending', () => {
    it('forgets the conversation when the flow reaches its last node', async () => {
      const subject = flow(
        [textNode(0, question('Name?')), textNode(1, 'Thanks, bye')],
        [link(0, 1)],
      );

      await conversation.respond(text('hi'), subject);
      expect(states.states).toHaveLength(1);

      await conversation.respond(text('Ana'), subject);
      expect(states.states).toHaveLength(0);
    });

    it('forgets the conversation right away when the flow is a single node', async () => {
      const subject = flow([textNode(0, 'We are closed today')]);

      const outputs = await conversation.respond(text('hi'), subject);

      expect(summary(outputs)).toEqual(['We are closed today']);
      expect(states.states).toHaveLength(0);
    });

    it('starts over when the user writes again after the flow ended', async () => {
      const subject = flow([textNode(0, 'We are closed today')]);

      await conversation.respond(text('hi'), subject);
      const outputs = await conversation.respond(text('hello?'), subject);

      expect(summary(outputs)).toEqual(['We are closed today']);
    });

    it('starts over from a leftover conversation that sits on a final node', async () => {
      const subject = flow([textNode(0, question('Name?')), textNode(1, 'Bye')], [link(0, 1)]);
      states.seed(CUSTOMER, subject.id, [{ response: 'Ana', next: 'default' }]);

      const outputs = await conversation.respond(text('hi'), subject);

      expect(summary(outputs)).toEqual(['Name?']);
      expect(states.stepsOf(CUSTOMER, subject.id)).toEqual([]);
    });

    it('keeps the conversation while it waits on an option that leads somewhere', async () => {
      const subject = flow([buttonsNode(0, 'Go on?', 'Yes'), textNode(1, 'Done')], [link(0, 1, 0)]);

      await conversation.respond(text('hi'), subject);

      expect(states.states).toHaveLength(1);
    });
  });

  describe('cyclic flows', () => {
    it('lets the user go around a loop that waits for input', async () => {
      const subject = flow(
        [buttonsNode(0, 'Again?', 'Again', 'Stop'), textNode(1, 'Stopped')],
        [link(0, 0, 0), link(0, 1, 1)],
      );

      await conversation.respond(text('hi'), subject);
      const again = await conversation.respond(buttonReply('Again'), subject);
      const stop = await conversation.respond(buttonReply('Stop'), subject);

      expect(summary(again)).toEqual(['[button: Again | Stop]']);
      expect(summary(stop)).toEqual(['Stopped']);
    });

    it('refuses to spin forever through a loop that never waits for input', async () => {
      const subject = flow([textNode(0, 'ping'), textNode(1, 'pong')], [link(0, 1), link(1, 0)]);

      await expect(conversation.respond(text('hi'), subject)).rejects.toThrow(
        `chains more than ${MAX_AUTOMATIC_STEPS} nodes`,
      );
    });
  });

  describe('flow options', () => {
    it('applies the configured media base URL', async () => {
      const subject = flow([textNode(0, { type: 'image', value: 'map.png' })]);
      const withMedia = new Conversation(states, { mediaBaseUrl: 'https://media.example.com' });

      const outputs = await withMedia.respond(text('hi'), subject);

      expect(outputs).toEqual([
        { kind: 'media', mediaType: 'image', url: 'https://media.example.com/flow-1/map.png' },
      ]);
    });
  });
});
