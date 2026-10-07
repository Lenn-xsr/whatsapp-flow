import { createLogger, loadEnvironment } from '@whatsapp-flow/shared';
import { Conversation } from './application/services/conversation';
import { FlowFinder } from './application/services/flow-finder';
import { DispatchMessageUseCase } from './application/usecases/dispatch-message.usecase';
import HandleIncomingMessageUseCase from './application/usecases/handle-incoming-message.usecase';
import { RunFlowUseCase } from './application/usecases/run-flow.usecase';
import { loadConfig } from './config/env';
import MessageConsumer from './drivers/amqp/message.consumer';
import { MessageHistoryAdapter } from './drivers/gateway/message.history.adapter';
import { MessageSenderAdapter } from './drivers/gateway/message.sender.adapter';
import { connectMongoDB } from './drivers/mongoose/connection';
import FlowRepositoryAdapter from './drivers/mongoose/flow.repository.adapter';
import StateRepositoryAdapter from './drivers/mongoose/state.repository.adapter';
import { ListenerRegistry } from './drivers/socket.io/listener.registry';
import MessageListenerAdapter from './drivers/socket.io/message.listener.adapter';
import { startSocketServer } from './drivers/socket.io/socket.server';

const logger = createLogger('flow-engine');

const bootstrap = async () => {
  await loadEnvironment();
  const config = loadConfig();

  await connectMongoDB(config.mongodbUri);

  const registry = new ListenerRegistry();
  const socketServer = startSocketServer(registry, config.socket);

  const stateRepo = new StateRepositoryAdapter();
  const flowRepo = new FlowRepositoryAdapter();

  const runFlow = new RunFlowUseCase(
    new FlowFinder(flowRepo, stateRepo),
    new Conversation(stateRepo, {
      ...(config.mediaBaseUrl ? { mediaBaseUrl: config.mediaBaseUrl } : {}),
    }),
    new MessageSenderAdapter({
      gatewayUrl: config.gateway.url,
      gatewayApiKey: config.gateway.apiKey,
      sender: config.sender,
      templateLanguage: config.templateLanguage,
    }),
  );

  const handleIncomingMessage = new HandleIncomingMessageUseCase(
    new MessageHistoryAdapter(config.gateway.url, config.gateway.apiKey),
    new DispatchMessageUseCase(new MessageListenerAdapter(socketServer, registry)),
    runFlow,
  );

  const consumer = await MessageConsumer.connect(config.rabbitmqUrl);
  await consumer.consume(async (message) => {
    const outcome = await handleIncomingMessage.execute(message);
    logger.info(`Message ${message.id} from ${message.author}: ${outcome}`);
  });

  logger.info('Waiting for messages');
};

bootstrap().catch((error) => {
  logger.error('Failed to start', error);
  process.exit(1);
});
