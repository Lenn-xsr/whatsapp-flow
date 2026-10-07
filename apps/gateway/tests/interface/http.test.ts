import { createHmac } from 'crypto';
import { FastifyInstance } from 'fastify';
import MessageUseCase from '../../src/application/usecases/message.usecase';
import SendMessageUseCase from '../../src/application/usecases/send-message.usecase';
import Message from '../../src/domain/message';
import HubSignatureValidator from '../../src/drivers/security/hub.signature.validator';
import MessageController from '../../src/interface/controllers/message.controller';
import WebhookController from '../../src/interface/controllers/webhook.controller';
import { buildServer } from '../../src/interface/http/server';
import { FakeWhatsappApi, InMemoryMessageRepository, RecordingMessageBroker } from '../fakes';

const API_KEY = 'gateway-key';
const APP_SECRET = 'app-secret';
const BUSINESS = '15550001111';
const CUSTOMER = '15550002222';

const authorized = { authorization: `Bearer ${API_KEY}` };

const sign = (body: string, algorithm: 'sha1' | 'sha256' = 'sha256') =>
  `${algorithm}=${createHmac(algorithm, APP_SECRET).update(body).digest('hex')}`;

const webhookBody = (messages: unknown[]) =>
  JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            field: 'messages',
            value: { metadata: { display_phone_number: BUSINESS }, messages },
          },
        ],
      },
    ],
  });

const inboundText = (body: string) => ({ from: CUSTOMER, type: 'text', text: { body } });

/**
 * The real HTTP server, controllers and use cases wired to in-memory ports
 * and exercised with injected requests (no socket is opened).
 */
describe('gateway HTTP API', () => {
  let server: FastifyInstance;
  let repository: InMemoryMessageRepository;
  let broker: RecordingMessageBroker;
  let whatsappApi: FakeWhatsappApi;

  const postWebhook = (payload: string, headers: Record<string, string>) =>
    server.inject({
      method: 'POST',
      url: '/webhook',
      payload,
      headers: { 'content-type': 'application/json', ...headers },
    });

  beforeEach(async () => {
    repository = new InMemoryMessageRepository();
    broker = new RecordingMessageBroker();
    whatsappApi = new FakeWhatsappApi();

    const messageUseCase = new MessageUseCase(repository, broker);

    server = await buildServer({
      messageController: new MessageController(
        new SendMessageUseCase(whatsappApi, messageUseCase),
        messageUseCase,
      ),
      webhookController: new WebhookController(
        messageUseCase,
        new HubSignatureValidator(APP_SECRET),
      ),
      apiKey: API_KEY,
      corsOrigin: '*',
      logger: false,
    });
  });

  afterEach(async () => {
    await server.close();
  });

  describe('GET /health', () => {
    it('answers without authentication', async () => {
      const response = await server.inject({ method: 'GET', url: '/health' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: 'ok' });
    });
  });

  describe('POST /webhook', () => {
    it('stores and publishes a signed user message', async () => {
      const payload = webhookBody([inboundText('hello')]);

      const response = await postWebhook(payload, { 'x-hub-signature-256': sign(payload) });

      expect(response.statusCode).toBe(200);
      expect(repository.messages).toHaveLength(1);
      expect(broker.published).toHaveLength(1);

      const [published] = broker.published;
      expect(published?.author).toBe(CUSTOMER);
      expect(published?.to).toBe(BUSINESS);
      expect(published?.message).toEqual(inboundText('hello'));
    });

    it('accepts the legacy SHA-1 signature header', async () => {
      const payload = webhookBody([inboundText('hello')]);

      const response = await postWebhook(payload, { 'x-hub-signature': sign(payload, 'sha1') });

      expect(response.statusCode).toBe(200);
      expect(broker.published).toHaveLength(1);
    });

    it('processes every message of a batched notification', async () => {
      const payload = webhookBody([inboundText('one'), inboundText('two')]);

      await postWebhook(payload, { 'x-hub-signature-256': sign(payload) });

      expect(broker.published.map((message) => message.message)).toEqual([
        inboundText('one'),
        inboundText('two'),
      ]);
    });

    it('rejects a request without signature', async () => {
      const response = await postWebhook(webhookBody([inboundText('hello')]), {});

      expect(response.statusCode).toBe(401);
      expect(repository.messages).toHaveLength(0);
      expect(broker.published).toHaveLength(0);
    });

    it('rejects a body that was modified after being signed', async () => {
      const signature = sign(webhookBody([inboundText('hello')]));
      const tampered = webhookBody([inboundText('send me your password')]);

      const response = await postWebhook(tampered, { 'x-hub-signature-256': signature });

      expect(response.statusCode).toBe(401);
      expect(broker.published).toHaveLength(0);
    });

    it('answers 401, not 500, to a malformed signature', async () => {
      const payload = webhookBody([inboundText('hello')]);

      const response = await postWebhook(payload, { 'x-hub-signature-256': 'sha256=short' });

      expect(response.statusCode).toBe(401);
    });

    it('acknowledges signed notifications that carry no user message', async () => {
      const payload = JSON.stringify({
        entry: [{ changes: [{ value: { statuses: [{ id: 'wamid.1', status: 'read' }] } }] }],
      });

      const response = await postWebhook(payload, { 'x-hub-signature-256': sign(payload) });

      expect(response.statusCode).toBe(200);
      expect(repository.messages).toHaveLength(0);
      expect(broker.published).toHaveLength(0);
    });

    it('answers 500 when the message cannot be published, so the sender retries', async () => {
      broker.failure = new Error('channel closed');
      const payload = webhookBody([inboundText('hello')]);

      const response = await postWebhook(payload, { 'x-hub-signature-256': sign(payload) });

      expect(response.statusCode).toBe(500);
    });
  });

  describe('POST /message', () => {
    const body = {
      author: BUSINESS,
      number: CUSTOMER,
      id: 'phone-number-id',
      token: 'meta-token',
      message: { type: 'text', text: { body: 'Hello!' } },
    };

    const postMessage = (payload: unknown, headers: Record<string, string> = authorized) =>
      server.inject({ method: 'POST', url: '/message', payload: payload as object, headers });

    it('delivers the message through the WhatsApp API and stores it', async () => {
      const response = await postMessage(body);

      expect(response.statusCode).toBe(200);
      expect(whatsappApi.deliveries).toEqual([
        {
          config: { accessToken: 'meta-token', phoneNumberId: 'phone-number-id', to: CUSTOMER },
          message: body.message,
        },
      ]);
      expect(repository.messages).toHaveLength(1);
      expect(repository.messages[0]?.author).toBe(BUSINESS);
      expect(repository.messages[0]?.to).toBe(CUSTOMER);
    });

    it.each([
      ['no Authorization header', {}],
      ['a wrong key', { authorization: 'Bearer wrong-key' }],
      ['the key without the Bearer scheme', { authorization: API_KEY }],
    ])('rejects a request with %s', async (_case, headers) => {
      const response = await postMessage(body, headers);

      expect(response.statusCode).toBe(401);
      expect(whatsappApi.deliveries).toHaveLength(0);
    });

    it.each(['author', 'number', 'id', 'token', 'message'])(
      'rejects a body without "%s"',
      async (field) => {
        const incomplete: Record<string, unknown> = { ...body };
        delete incomplete[field];

        const response = await postMessage(incomplete);

        expect(response.statusCode).toBe(400);
        expect(whatsappApi.deliveries).toHaveLength(0);
      },
    );

    it('rejects a message that is not an object', async () => {
      const response = await postMessage({ ...body, message: '{"type":"text"}' });

      expect(response.statusCode).toBe(400);
    });

    it('answers 502 and stores nothing when the WhatsApp API rejects the message', async () => {
      whatsappApi.failure = new Error('Invalid OAuth access token');

      const response = await postMessage(body);

      expect(response.statusCode).toBe(502);
      expect(repository.messages).toHaveLength(0);
    });
  });

  describe('GET /messages/:author/:to', () => {
    const stored = (id: string, author: string, to: string, date: string) =>
      Message.create({
        id,
        author,
        to,
        date: new Date(date),
        message: { type: 'text', text: { body: id } },
      });

    it('lists the messages from the author to the recipient, newest first', async () => {
      repository.messages = [
        stored('first', CUSTOMER, BUSINESS, '2024-01-01T10:00:00.000Z'),
        stored('answer', BUSINESS, CUSTOMER, '2024-01-01T10:01:00.000Z'),
        stored('second', CUSTOMER, BUSINESS, '2024-01-01T10:02:00.000Z'),
      ];

      const response = await server.inject({
        method: 'GET',
        url: `/messages/${CUSTOMER}/${BUSINESS}`,
        headers: authorized,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([
        {
          id: 'second',
          author: CUSTOMER,
          to: BUSINESS,
          date: '2024-01-01T10:02:00.000Z',
          message: { type: 'text', text: { body: 'second' } },
        },
        {
          id: 'first',
          author: CUSTOMER,
          to: BUSINESS,
          date: '2024-01-01T10:00:00.000Z',
          message: { type: 'text', text: { body: 'first' } },
        },
      ]);
    });

    it('requires the API key', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/messages/${CUSTOMER}/${BUSINESS}`,
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
