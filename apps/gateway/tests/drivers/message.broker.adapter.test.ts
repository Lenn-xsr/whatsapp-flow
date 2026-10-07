import {
  INBOUND_MESSAGE_ROUTING_KEY,
  InboundMessageEvent,
  MESSAGES_EXCHANGE,
} from '@whatsapp-flow/shared';
import MessageBrokerAdapter from '../../src/drivers/amqp/message.broker.adapter';
import Message from '../../src/domain/message';

describe('MessageBrokerAdapter', () => {
  it('publishes the message as a persistent JSON event on the messages exchange', async () => {
    const publish = jest.fn().mockReturnValue(true);
    const adapter = new MessageBrokerAdapter({ publish });

    await adapter.publishMessage(
      Message.create({
        id: 'message-1',
        author: '15550002222',
        to: '15550001111',
        date: new Date('2024-01-01T10:00:00.000Z'),
        message: { type: 'text', text: { body: 'hello' } },
      }),
    );

    expect(publish).toHaveBeenCalledTimes(1);
    const [exchange, routingKey, content, options] = publish.mock.calls[0];

    expect(exchange).toBe(MESSAGES_EXCHANGE);
    expect(routingKey).toBe(INBOUND_MESSAGE_ROUTING_KEY);
    expect(options).toEqual(expect.objectContaining({ persistent: true }));

    const event: InboundMessageEvent = JSON.parse(content.toString());
    expect(event).toEqual({
      id: 'message-1',
      author: '15550002222',
      to: '15550001111',
      date: '2024-01-01T10:00:00.000Z',
      message: { type: 'text', text: { body: 'hello' } },
    });
  });
});
