import {
  DelayNodeProcessor,
  InteractionNodeProcessor,
  MediaHandler,
  TextNodeProcessor,
  VariableParser,
} from '../../src/domain/flow';
import { buttonsNode, delayNode, listNode, question, textNode } from '../support/flows';

const parser = new VariableParser();

describe('TextNodeProcessor', () => {
  const processor = (vars?: Record<string, string>, mediaBaseUrl?: string) =>
    new TextNodeProcessor(new MediaHandler('flow-1', mediaBaseUrl), parser, vars);

  it('handles text nodes only', () => {
    expect(processor().canProcess(textNode(0, 'hi'))).toBe(true);
    expect(processor().canProcess(buttonsNode(0, 'Pick', 'A'))).toBe(false);
    expect(processor().canProcess(delayNode(0, 1))).toBe(false);
  });

  it('outputs the messages of the node in order', () => {
    const result = processor().process(textNode(0, 'First', 'Second'));

    expect(result.outputs).toEqual([
      { kind: 'text', text: 'First' },
      { kind: 'text', text: 'Second' },
    ]);
  });

  it('moves on to the next node when it does not end with a question', () => {
    expect(processor().process(textNode(0, 'Welcome')).autoAdvance).toBe(true);
  });

  it('waits for the answer when the last message is a question', () => {
    const result = processor().process(textNode(0, 'Welcome', question('What is your name?')));

    expect(result.outputs).toEqual([
      { kind: 'text', text: 'Welcome' },
      { kind: 'text', text: 'What is your name?' },
    ]);
    expect(result.autoAdvance).toBe(false);
  });

  it('does not wait when a question is followed by another message', () => {
    const result = processor().process(textNode(0, question('Ready?'), 'Here we go'));

    expect(result.autoAdvance).toBe(true);
  });

  it('fills placeholders in texts and questions', () => {
    const result = processor({ name: 'Ana' }).process(
      textNode(0, 'Hi ${name}', question('Is ${name} right?')),
    );

    expect(result.outputs).toEqual([
      { kind: 'text', text: 'Hi Ana' },
      { kind: 'text', text: 'Is Ana right?' },
    ]);
  });

  it('outputs templates by name', () => {
    const result = processor().process(textNode(0, { type: 'template', value: 'order_update' }));

    expect(result.outputs).toEqual([{ kind: 'template', name: 'order_update' }]);
  });

  it('outputs inline delays in seconds', () => {
    const result = processor().process(textNode(0, 'One', { type: 'delay', value: '3' }, 'Two'));

    expect(result.outputs).toEqual([
      { kind: 'text', text: 'One' },
      { kind: 'delay', seconds: 3 },
      { kind: 'text', text: 'Two' },
    ]);
  });

  it('treats an invalid inline delay as no delay', () => {
    const result = processor().process(textNode(0, { type: 'delay', value: 'soon' }));

    expect(result.outputs).toEqual([{ kind: 'delay', seconds: 0 }]);
  });

  it.each(['audio', 'video', 'image'] as const)(
    'resolves %s messages to a URL under the media base URL',
    (type) => {
      const result = processor(undefined, 'https://media.example.com/flows/').process(
        textNode(0, { type, value: 'intro file' }),
      );

      expect(result.outputs).toEqual([
        {
          kind: 'media',
          mediaType: type,
          url: 'https://media.example.com/flows/flow-1/intro%20file',
        },
      ]);
    },
  );

  it('refuses media when no media base URL is configured', () => {
    expect(() => processor().process(textNode(0, { type: 'image', value: 'logo.png' }))).toThrow(
      'no media base URL is configured',
    );
  });

  it('rejects message types it does not know', () => {
    expect(() => processor().process(textNode(0, { type: 'sticker', value: 'x' }))).toThrow(
      'Unsupported message type: sticker',
    );
  });

  it('outputs nothing for a node without messages', () => {
    const node = textNode(0);
    delete node.extra.value.messages;

    expect(processor().process(node)).toEqual({ outputs: [], autoAdvance: true });
  });
});

describe('InteractionNodeProcessor', () => {
  const processor = (vars?: Record<string, string>) => new InteractionNodeProcessor(parser, vars);

  it('handles interaction nodes only', () => {
    expect(processor().canProcess(buttonsNode(0, 'Pick', 'A'))).toBe(true);
    expect(processor().canProcess(textNode(0, 'hi'))).toBe(false);
  });

  it('presents the options as reply buttons and waits for the choice', () => {
    const result = processor().process(buttonsNode(0, 'Do you confirm?', 'Yes', 'No'));

    expect(result).toEqual({
      outputs: [
        {
          kind: 'interaction',
          interactionType: 'button',
          text: 'Do you confirm?',
          header: null,
          footer: null,
          options: [
            { id: 'Yes', title: 'Yes' },
            { id: 'No', title: 'No' },
          ],
        },
      ],
      autoAdvance: false,
    });
  });

  it('presents a list menu with its button label and row descriptions', () => {
    const result = processor().process(
      listNode(
        0,
        'How can we help?',
        'Choose',
        { value: 'Sales', subtitle: 'Talk to sales' },
        { value: 'Support' },
      ),
    );

    expect(result.outputs).toEqual([
      {
        kind: 'interaction',
        interactionType: 'list',
        text: 'How can we help?',
        header: null,
        footer: null,
        listButton: 'Choose',
        options: [
          { id: 'Sales', title: 'Sales', description: 'Talk to sales' },
          { id: 'Support', title: 'Support' },
        ],
      },
    ]);
  });

  it('includes the header and footer when they have content', () => {
    const node = buttonsNode(0, 'Body', 'Ok');
    node.extra.value.header = { type: 'text', value: 'Heads up' };
    node.extra.value.footer = { text: 'Reply any time' };

    const [output] = processor().process(node).outputs;

    expect(output).toMatchObject({
      header: { type: 'text', value: 'Heads up' },
      footer: 'Reply any time',
    });
  });

  it('leaves out an empty header and footer', () => {
    const node = buttonsNode(0, 'Body', 'Ok');
    node.extra.value.header = { type: 'text', value: '' };
    node.extra.value.footer = { text: '' };

    const [output] = processor().process(node).outputs;

    expect(output).toMatchObject({ header: null, footer: null });
  });

  it('fills placeholders in the body', () => {
    const [output] = processor({ name: 'Ana' }).process(buttonsNode(0, 'Hi ${name}', 'Ok')).outputs;

    expect(output).toMatchObject({ text: 'Hi Ana' });
  });

  it('rejects a node without action', () => {
    const node = buttonsNode(0, 'Body', 'Ok');
    delete node.extra.value.action;

    expect(() => processor().process(node)).toThrow('Invalid interaction node: missing action');
  });
});

describe('DelayNodeProcessor', () => {
  const processor = new DelayNodeProcessor();

  it('handles delay nodes only', () => {
    expect(processor.canProcess(delayNode(0, 5))).toBe(true);
    expect(processor.canProcess(textNode(0, 'hi'))).toBe(false);
  });

  it('pauses for the configured seconds and then moves on', () => {
    expect(processor.process(delayNode(0, 5))).toEqual({
      outputs: [{ kind: 'delay', seconds: 5 }],
      autoAdvance: true,
    });
  });

  it.each([undefined, 0, -3, Number.NaN])('does not pause for a delay of %p', (delay) => {
    const node = delayNode(0, 0);
    node.extra.value.delay = delay as number;

    expect(processor.process(node).outputs).toEqual([{ kind: 'delay', seconds: 0 }]);
  });
});
