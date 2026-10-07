import Fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyRawBody from 'fastify-raw-body';
import MessageController from '../controllers/message.controller';
import WebhookController from '../controllers/webhook.controller';
import { apiKeyAuth } from '../middlewares/api.key.middleware';

export interface ServerOptions {
  messageController: MessageController;
  webhookController: WebhookController;
  /** Key clients must send as `Authorization: Bearer <key>`. */
  apiKey: string;
  corsOrigin: string;
  logger?: boolean;
}

/**
 * Builds the HTTP server with every route registered, without listening:
 *
 * - `GET  /health`                 liveness probe, no authentication
 * - `POST /webhook`                WhatsApp Cloud API notifications, authenticated by signature
 * - `POST /message`                send a message, authenticated by API key
 * - `GET  /messages/:author/:to`   stored messages, authenticated by API key
 */
export async function buildServer(options: ServerOptions): Promise<FastifyInstance> {
  const { messageController, webhookController } = options;

  const fastify = Fastify({
    logger: options.logger ?? true,
    trustProxy: true,
  });

  // The webhook signature is computed over the exact bytes Meta sent, so the
  // raw body is kept for the routes that ask for it.
  await fastify.register(fastifyRawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
  });

  await fastify.register(fastifyCors, {
    origin: options.corsOrigin,
    methods: ['GET', 'POST'],
  });

  const requireApiKey = apiKeyAuth(options.apiKey);

  fastify.get('/health', async () => ({ status: 'ok' }));

  fastify.post('/webhook', { config: { rawBody: true } }, (req, res) =>
    webhookController.execute(req, res),
  );

  fastify.post('/message', { preHandler: requireApiKey }, (req, res) =>
    messageController.createMessage(req, res),
  );

  fastify.get('/messages/:author/:to', { preHandler: requireApiKey }, (req, res) =>
    messageController.getLastMessages(req, res),
  );

  return fastify;
}
