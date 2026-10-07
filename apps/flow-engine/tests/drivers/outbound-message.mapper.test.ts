import { InteractionOutput } from '../../src/domain/flow';
import { toSdkMessage } from '../../src/drivers/gateway/outbound-message.mapper';

/** The payload the SDK would put in the body of `POST /message`. */
const payloadOf = (...args: Parameters<typeof toSdkMessage>) =>
  JSON.parse(JSON.stringify(toSdkMessage(...args)));

const buttons: InteractionOutput = {
  kind: 'interaction',
  interactionType: 'button',
  text: 'Do you confirm?',
  header: null,
  footer: null,
  options: [
    { id: 'Yes', title: 'Yes' },
    { id: 'No', title: 'No' },
  ],
};

const list: InteractionOutput = {
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
};

describe('toSdkMessage', () => {
  it('renders a text output as a text message', () => {
    expect(payloadOf({ kind: 'text', text: 'Hello' })).toEqual({
      type: 'text',
      text: { body: 'Hello' },
    });
  });

  it('renders a template output in the default language', () => {
    expect(payloadOf({ kind: 'template', name: 'order_update' })).toEqual({
      type: 'template',
      template: { name: 'order_update', language: { code: 'en_US' } },
    });
  });

  it('renders a template output in the configured language', () => {
    const payload = payloadOf(
      { kind: 'template', name: 'order_update' },
      { templateLanguage: 'pt_BR' },
    );

    expect(payload.template.language).toEqual({ code: 'pt_BR' });
  });

  it.each(['audio', 'video', 'image'] as const)('renders %s media by link', (mediaType) => {
    const url = `https://media.example.com/flow-1/file.${mediaType}`;

    expect(payloadOf({ kind: 'media', mediaType, url })).toEqual({
      type: mediaType,
      [mediaType]: { link: url },
    });
  });

  it('renders button options as reply buttons', () => {
    expect(payloadOf(buttons)).toEqual({
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: 'Do you confirm?' },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'Yes', title: 'Yes' } },
            { type: 'reply', reply: { id: 'No', title: 'No' } },
          ],
        },
      },
    });
  });

  it('renders list options as a single-section list menu', () => {
    expect(payloadOf(list)).toEqual({
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: 'How can we help?' },
        action: {
          button: 'Choose',
          sections: [
            {
              title: 'Options',
              rows: [
                { id: 'Sales', title: 'Sales', description: 'Talk to sales' },
                { id: 'Support', title: 'Support' },
              ],
            },
          ],
        },
      },
    });
  });

  it('gives the list button a label when the flow does not set one', () => {
    const { listButton: _unused, ...withoutLabel } = list;

    expect(payloadOf(withoutLabel).interactive.action.button).toBe('Options');
  });

  it('adds a text header and a footer', () => {
    const payload = payloadOf({
      ...buttons,
      header: { type: 'text', value: 'Order #1234' },
      footer: 'Reply within 24 hours',
    });

    expect(payload.interactive.header).toEqual({ type: 'text', text: 'Order #1234' });
    expect(payload.interactive.footer).toEqual({ text: 'Reply within 24 hours' });
  });

  it('adds a media header by link', () => {
    const payload = payloadOf({
      ...buttons,
      header: { type: 'image', value: 'https://media.example.com/banner.png' },
    });

    expect(payload.interactive.header).toEqual({
      type: 'image',
      image: { link: 'https://media.example.com/banner.png' },
    });
  });

  it('leaves out a header of a type WhatsApp does not support', () => {
    const payload = payloadOf({ ...buttons, header: { type: 'sticker', value: 'x' } });

    expect(payload.interactive.header).toBeUndefined();
  });
});
