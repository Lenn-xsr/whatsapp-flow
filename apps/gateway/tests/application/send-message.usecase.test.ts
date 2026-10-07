import MessageUseCase from '../../src/application/usecases/message.usecase';
import SendMessageUseCase from '../../src/application/usecases/send-message.usecase';
import { FakeWhatsappApi, InMemoryMessageRepository, RecordingMessageBroker } from '../fakes';

const dto = {
  author: '15550001111',
  to: '15550002222',
  phoneNumberId: 'phone-number-id',
  accessToken: 'meta-token',
  message: { type: 'text', text: { body: 'Your order has shipped' } },
};

describe('SendMessageUseCase', () => {
  let repository: InMemoryMessageRepository;
  let broker: RecordingMessageBroker;
  let whatsappApi: FakeWhatsappApi;
  let useCase: SendMessageUseCase;

  beforeEach(() => {
    repository = new InMemoryMessageRepository();
    broker = new RecordingMessageBroker();
    whatsappApi = new FakeWhatsappApi();
    useCase = new SendMessageUseCase(whatsappApi, new MessageUseCase(repository, broker));
  });

  it('delivers the message with the credentials of the sender', async () => {
    await useCase.execute(dto);

    expect(whatsappApi.deliveries).toEqual([
      {
        config: { accessToken: 'meta-token', phoneNumberId: 'phone-number-id', to: '15550002222' },
        message: dto.message,
      },
    ]);
  });

  it('stores the delivered message as written by the business number', async () => {
    const message = await useCase.execute(dto);

    expect(repository.messages).toEqual([message]);
    expect(message.author).toBe('15550001111');
    expect(message.to).toBe('15550002222');
    expect(message.message).toEqual(dto.message);
  });

  it('does not publish outbound messages to the flow-engine', async () => {
    await useCase.execute(dto);

    expect(broker.published).toHaveLength(0);
  });

  it('stores nothing when the WhatsApp API rejects the message', async () => {
    whatsappApi.failure = new Error('Invalid OAuth access token');

    await expect(useCase.execute(dto)).rejects.toThrow('Invalid OAuth access token');

    expect(repository.messages).toHaveLength(0);
  });
});
