import { ConsumeMessage } from 'amqplib';
import { InboundMessageEvent } from '@whatsapp-flow/shared';
import Message from '../../src/domain/message';
import MessageConsumer from '../../src/drivers/amqp/message.consumer';
import { MessageMapper } from '../../src/drivers/amqp/message.mapper';

const event = (overrides: Partial<InboundMessageEvent> = {}): InboundMessageEvent => ({
  id: 'message-1',
  author: '15550002222',
  to: '15550001111',
  date: '2024-01-01T10:00:00.000Z',
  message: { type: 'text', text: { body: 'hello' } },
  ...overrides,
});

const delivery = (body: unknown): ConsumeMessage =>
  ({
    content: Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)),
  }) as ConsumeMessage;

describe('MessageMapper', () => {
  it('turns the event published by the gateway into a domain message', () => {
    const message = MessageMapper.toDomain(delivery(event()).content);

    expect(message.id).toBe('message-1');
    expect(message.author).toBe('15550002222');
    expect(message.to).toBe('15550001111');
    expect(message.date).toEqual(new Date('2024-01-01T10:00:00.000Z'));
    expect(message.response).toBe('hello');
  });

  it('rejects events without the routing fields', () => {
    const { author: _author, ...incomplete } = event();

    expect(() => MessageMapper.toDomain(delivery(incomplete).content)).toThrow(
      'missing id, author or to',
    );
  });

  it('rejects message types the engine does not understand', () => {
    const image = event({ message: { type: 'image', image: { id: 'media-id' } } });

    expect(() => MessageMapper.toDomain(delivery(image).content)).toThrow(
      'Unsupported message type: image',
    );
  });
});

describe('MessageConsumer', () => {
  let channel: { consume: jest.Mock; ack: jest.Mock; nack: jest.Mock };
  let consumer: MessageConsumer;

  beforeEach(() => {
    channel = { consume: jest.fn(), ack: jest.fn(), nack: jest.fn() };
    consumer = new MessageConsumer(channel);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('acknowledges a message once the handler is done with it', async () => {
    const received: Message[] = [];
    const incoming = delivery(event());
    let acknowledgedBeforeHandlerFinished = false;

    await consumer.handleDelivery(incoming, async (message) => {
      await Promise.resolve();
      acknowledgedBeforeHandlerFinished = channel.ack.mock.calls.length > 0;
      received.push(message);
    });

    expect(received.map((message) => message.id)).toEqual(['message-1']);
    expect(acknowledgedBeforeHandlerFinished).toBe(false);
    expect(channel.ack).toHaveBeenCalledWith(incoming);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('rejects the message without requeueing it when the handler fails', async () => {
    const incoming = delivery(event());

    await consumer.handleDelivery(incoming, async () => {
      throw new Error('gateway unavailable');
    });

    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).toHaveBeenCalledWith(incoming, false, false);
  });

  it.each([
    ['an unsupported message type', event({ message: { type: 'audio', audio: {} } })],
    ['a body that is not JSON', 'not json'],
    ['a JSON body that is not an event', '42'],
  ])('skips %s without calling the handler', async (_case, body) => {
    const handler = jest.fn();
    const incoming = delivery(body);

    await consumer.handleDelivery(incoming, handler);

    expect(handler).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledWith(incoming);
    expect(channel.nack).not.toHaveBeenCalled();
  });
});
