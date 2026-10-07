import { extractInboundMessages } from '../../src/interface/mappers/webhook.mapper';

const BUSINESS = '15550001111';

const textMessage = (from: string, body: string) => ({
  from,
  id: `wamid.${body}`,
  timestamp: '1700000000',
  type: 'text',
  text: { body },
});

/** Builds a notification shaped like the ones the WhatsApp Cloud API sends. */
const notification = (...values: unknown[]) => ({
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'business-account-id',
      changes: values.map((value) => ({ field: 'messages', value })),
    },
  ],
});

const valueWith = (messages: unknown[], displayPhoneNumber: string = BUSINESS) => ({
  messaging_product: 'whatsapp',
  metadata: { display_phone_number: displayPhoneNumber, phone_number_id: 'phone-number-id' },
  messages,
});

describe('extractInboundMessages', () => {
  it('maps a user message to its author, receiving number and raw content', () => {
    const message = textMessage('15550002222', 'hello');

    expect(extractInboundMessages(notification(valueWith([message])))).toEqual([
      { author: '15550002222', to: BUSINESS, message },
    ]);
  });

  it('keeps non-text messages untouched', () => {
    const reply = {
      from: '15550002222',
      type: 'interactive',
      interactive: { type: 'button_reply', button_reply: { id: 'Yes', title: 'Yes' } },
    };

    const [extracted] = extractInboundMessages(notification(valueWith([reply])));

    expect(extracted?.message).toBe(reply);
  });

  it('returns every message of a batched notification in order', () => {
    const body = {
      entry: [
        {
          changes: [
            {
              value: valueWith([
                textMessage('15550002222', 'one'),
                textMessage('15550002222', 'two'),
              ]),
            },
            { value: valueWith([textMessage('15550003333', 'three')], '15550009999') },
          ],
        },
        { changes: [{ value: valueWith([textMessage('15550004444', 'four')]) }] },
      ],
    };

    expect(
      extractInboundMessages(body).map(({ author, to, message }) => [
        author,
        to,
        (message.text as { body: string }).body,
      ]),
    ).toEqual([
      ['15550002222', BUSINESS, 'one'],
      ['15550002222', BUSINESS, 'two'],
      ['15550003333', '15550009999', 'three'],
      ['15550004444', BUSINESS, 'four'],
    ]);
  });

  it('ignores delivery status notifications', () => {
    const statuses = {
      messaging_product: 'whatsapp',
      metadata: { display_phone_number: BUSINESS },
      statuses: [{ id: 'wamid.1', status: 'delivered', recipient_id: '15550002222' }],
    };

    expect(extractInboundMessages(notification(statuses))).toEqual([]);
  });

  it('skips changes that do not say which number received the message', () => {
    const value = { messages: [textMessage('15550002222', 'hello')] };

    expect(extractInboundMessages(notification(value))).toEqual([]);
  });

  it('skips messages without a sender and keeps the valid ones', () => {
    const valid = textMessage('15550002222', 'hello');
    const value = valueWith([{ type: 'text', text: { body: 'anonymous' } }, null, valid]);

    expect(extractInboundMessages(notification(value))).toEqual([
      { author: '15550002222', to: BUSINESS, message: valid },
    ]);
  });

  it.each([
    ['null', null],
    ['a string', 'entry'],
    ['an array', []],
    ['an empty object', {}],
    ['an entry that is not a list', { entry: 'nope' }],
    ['entries without changes', { entry: [{}, null] }],
    ['changes without value', { entry: [{ changes: [{}, null] }] }],
  ])('returns no messages for %s', (_case, body) => {
    expect(extractInboundMessages(body)).toEqual([]);
  });
});
