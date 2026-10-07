import { createLogger, loadEnvironment } from '@whatsapp-flow/shared';
import MessageUseCase from './application/usecases/message.usecase';
import SendMessageUseCase from './application/usecases/send-message.usecase';
import { loadConfig } from './config/env';
import MessageBrokerAdapter from './drivers/amqp/message.broker.adapter';
import { connectMongoDB } from './drivers/mongoose/connection';
import MessageRepositoryAdapter from './drivers/mongoose/message.repository.adapter';
import HubSignatureValidator from './drivers/security/hub.signature.validator';
import { WhatsappApiAdapter } from './drivers/whatsapp/whatsapp.api.adapter';
import MessageController from './interface/controllers/message.controller';
import WebhookController from './interface/controllers/webhook.controller';
import { buildServer } from './interface/http/server';

const logger = createLogger('gateway');

const bootstrap = async () => {
  await loadEnvironment();
  const config = loadConfig();

  await connectMongoDB(config.mongodbUri);
  const messageBroker = await MessageBrokerAdapter.connect(config.rabbitmqUrl);

  const messageUseCase = new MessageUseCase(new MessageRepositoryAdapter(), messageBroker);
  const sendMessageUseCase = new SendMessageUseCase(
    new WhatsappApiAdapter(config.whatsappApiUrl),
    messageUseCase,
  );

  const server = await buildServer({
    messageController: new MessageController(sendMessageUseCase, messageUseCase),
    webhookController: new WebhookController(
      messageUseCase,
      new HubSignatureValidator(config.metaAppSecret),
    ),
    apiKey: config.apiKey,
    corsOrigin: config.corsOrigin,
  });

  await server.listen({ port: config.port, host: config.host });
};

bootstrap().catch((error) => {
  logger.error('Failed to start', error);
  process.exit(1);
});
