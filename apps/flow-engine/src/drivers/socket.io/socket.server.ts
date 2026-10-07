import { createServer } from 'http';
import { Server } from 'socket.io';
import { createLogger } from '@whatsapp-flow/shared';
import { ListenerRegistry } from './listener.registry';
import { socketAuth } from './socket.auth.middleware';
import { SocketHandler } from './socket.handler';

const logger = createLogger('socket.io');

export interface SocketServerOptions {
  port: number;
  /** Token clients must send in the handshake (`auth: { token }`). */
  authToken: string;
  corsOrigin: string;
}

/** Starts the socket.io server external listeners connect to. */
export function startSocketServer(
  registry: ListenerRegistry,
  options: SocketServerOptions,
): Server {
  const httpServer = createServer();

  const io = new Server(httpServer, {
    cors: {
      origin: options.corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  io.use(socketAuth(options.authToken));

  const handler = new SocketHandler(registry);
  io.on('connection', (socket) => handler.onConnection(socket));

  httpServer.listen(options.port, () => {
    logger.info(`Listening on port ${options.port}`);
  });

  return io;
}
