import MessageUseCase, {
  MESSAGE_RETRIEVAL_LIMIT,
} from '../../src/application/usecases/message.usecase';
import Message from '../../src/domain/message';
import { InMemoryMessageRepository, RecordingMessageBroker } from '../fakes';

const CUSTOMER = '15550002222';
const BUSINESS = '15550001111';

const text = (body: string) => ({ type: 'text', text: { body } });

describe('MessageUseCase', () => {
  let repository: InMemoryMessageRepository;
  let broker: RecordingMessageBroker;
  let useCase: MessageUseCase;

  beforeEach(() => {
    repository = new InMemoryMessageRepository();
    broker = new RecordingMessageBroker();
    useCase = new MessageUseCase(repository, broker);
  });

  describe('receive', () => {
    it('stores the inbound message and publishes it', async () => {
      const message = await useCase.receive({
        author: CUSTOMER,
        to: BUSINESS,
        message: text('hi'),
      });

      expect(repository.messages).toEqual([message]);
      expect(broker.published).toEqual([message]);
      expect(message.author).toBe(CUSTOMER);
      expect(message.to).toBe(BUSINESS);
      expect(message.message).toEqual(text('hi'));
      expect(message.date).toBeInstanceOf(Date);
    });

    it('gives each message its own id', async () => {
      const first = await useCase.receive({ author: CUSTOMER, to: BUSINESS, message: text('a') });
      const second = await useCase.receive({ author: CUSTOMER, to: BUSINESS, message: text('b') });

      expect(first.id).not.toBe(second.id);
    });

    it('keeps the stored message and reports the failure when publishing fails', async () => {
      broker.failure = new Error('channel closed');

      await expect(
        useCase.receive({ author: CUSTOMER, to: BUSINESS, message: text('hi') }),
      ).rejects.toThrow('channel closed');

      expect(repository.messages).toHaveLength(1);
    });
  });

  describe('record', () => {
    it('stores the message without publishing it', async () => {
      await useCase.record({ author: BUSINESS, to: CUSTOMER, message: text('hello') });

      expect(repository.messages).toHaveLength(1);
      expect(broker.published).toHaveLength(0);
    });
  });

  describe('getLastMessages', () => {
    const stored = (id: string, author: string, to: string, date: string) =>
      Message.create({ id, author, to, date: new Date(date), message: text(id) });

    it('returns only the messages from the author to the recipient, newest first', async () => {
      repository.messages = [
        stored('old', CUSTOMER, BUSINESS, '2024-01-01T10:00:00Z'),
        stored('reply', BUSINESS, CUSTOMER, '2024-01-01T10:01:00Z'),
        stored('new', CUSTOMER, BUSINESS, '2024-01-01T10:02:00Z'),
        stored('other-customer', '15550003333', BUSINESS, '2024-01-01T10:03:00Z'),
      ];

      const messages = await useCase.getLastMessages(CUSTOMER, BUSINESS);

      expect(messages.map((message) => message.id)).toEqual(['new', 'old']);
    });

    it('caps the result at the retrieval limit', async () => {
      repository.messages = Array.from({ length: MESSAGE_RETRIEVAL_LIMIT + 5 }, (_, index) =>
        stored(`m${index}`, CUSTOMER, BUSINESS, new Date(2024, 0, 1, 0, index).toISOString()),
      );

      const messages = await useCase.getLastMessages(CUSTOMER, BUSINESS);

      expect(messages).toHaveLength(MESSAGE_RETRIEVAL_LIMIT);
      expect(messages[0]?.id).toBe(`m${MESSAGE_RETRIEVAL_LIMIT + 4}`);
    });
  });
});
