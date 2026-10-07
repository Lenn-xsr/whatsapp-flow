import { ReplyMessage } from '../infra/ReplyMessage';
import { MessageIdentifier } from '../types';
import { WebSocketClient } from './Websocket';
import { Rest } from './Rest';
import { MessageManager } from '../manager/MessageManager';
import { ConnectionError, InitializationError, ValidationError } from '../errors';
import { validateRequired, validateUrl } from '../utils/Validation';
import { getLogger } from '../utils/Logger';

/**
 * A WhatsApp Business phone number messages are sent from.
 *
 * The gateway does not store Meta credentials: `numberID` and `token` are
 * sent along with every `POST /message` request and the gateway uses them to
 * call the WhatsApp Cloud API.
 */
export interface Sender {
  /** Label used to pick this sender with `send(..., { from: name })` */
  name: string;
  /** Phone number, digits only with country code (e.g. 15550001111) */
  number: string;
  /** Phone number ID of this number in the WhatsApp Cloud API */
  numberID: string;
  /** Whether this sender is used when `from` is omitted */
  default: boolean;
  /** Meta access token allowed to send messages from this number */
  token: string;
}

/**
 * Client configuration.
 *
 * @example
 * ```typescript
 * const options: ClientOptions = {
 *   sender: {
 *     name: 'support',
 *     number: '15550001111',
 *     numberID: '<phone-number-id>',
 *     default: true,
 *     token: '<meta-access-token>',
 *   },
 *   rest: { url: 'http://localhost:3000', token: '<gateway API_KEY>' },
 *   ws: { url: 'http://localhost:3001', token: '<flow-engine SOCKET_AUTH_TOKEN>' },
 * };
 * ```
 */
export interface ClientOptions {
  /** Sender configuration (single sender or array of multiple senders) */
  sender: Sender | Sender[];
  /** The gateway HTTP API, used to send messages */
  rest: {
    /** Base URL of the gateway */
    url: string;
    /** The gateway's `API_KEY` */
    token: string;
  };
  /**
   * The flow-engine socket.io server, used to receive messages.
   * Optional: leave it out for a send-only client.
   */
  ws?: {
    /** URL of the flow-engine socket.io server (http(s):// or ws(s)://) */
    url: string;
    /** The flow-engine's `SOCKET_AUTH_TOKEN` */
    token: string;
  };
}

const SOCKET_PROTOCOLS = ['http:', 'https:', 'ws:', 'wss:'];

/**
 * Client for the whatsapp-flow services.
 *
 * It does not talk to Meta directly: messages are sent through the gateway
 * (`POST /message`) and received from the flow-engine over socket.io.
 *
 * @example
 * ```typescript
 * import { WhatsappClient, TextMessage } from '@whatsapp-flow/sdk';
 *
 * const client = new WhatsappClient(options);
 * await client.initialize();
 *
 * await client.messages.send('15550002222', {
 *   message: new TextMessage().setBody('Hello, World!'),
 * });
 *
 * client.onMessage({ type: 'text', number: '15550001111', content: 'help' }, (message) =>
 *   message.reply(new TextMessage().setBody('An agent will be with you shortly.')),
 * );
 * ```
 */
export class WhatsappClient {
  /** HTTP client for the gateway */
  rest: Rest;
  /** Sends messages through the gateway */
  messages: MessageManager;
  /** socket.io client for the flow-engine (null until `initialize()` connects it) */
  websocket: WebSocketClient | null = null;
  private readonly logger = getLogger();

  /**
   * @throws ValidationError if the configuration is missing or invalid
   */
  constructor(public readonly options: ClientOptions) {
    this.validateOptions(options);
    this.rest = new Rest(this.options.rest.url, this.options.rest.token);
    this.messages = new MessageManager(this);
  }

  private validateOptions(options: ClientOptions): void {
    if (!options.sender) {
      throw new ValidationError('Sender configuration is required', 'sender');
    }

    if (Array.isArray(options.sender)) {
      if (options.sender.length === 0) {
        throw new ValidationError('At least one sender must be configured', 'sender');
      }

      const hasDefault = options.sender.some((sender) => sender.default);
      if (!hasDefault) {
        throw new ValidationError('At least one sender must be marked as default', 'sender');
      }
    }

    validateRequired(options.rest?.url, 'REST URL');
    validateUrl(options.rest.url, 'REST URL');
    validateRequired(options.rest?.token, 'REST token');

    if (options.ws) {
      validateRequired(options.ws.url, 'WebSocket URL');
      this.validateSocketUrl(options.ws.url);
      validateRequired(options.ws.token, 'WebSocket token');
    }
  }

  private validateSocketUrl(url: string): void {
    let protocol: string | undefined;
    try {
      protocol = new URL(url).protocol;
    } catch {
      protocol = undefined;
    }

    if (!protocol || !SOCKET_PROTOCOLS.includes(protocol)) {
      throw new ValidationError('WebSocket URL must be a valid URL', 'WebSocket URL');
    }
  }

  /**
   * Registers a listener for inbound messages matching the identifier.
   *
   * While the listener is registered, matching messages are delivered here
   * instead of being answered by a flow.
   *
   * @throws ConnectionError if the socket is not connected
   */
  onMessage(identifier: MessageIdentifier, callback: (message: ReplyMessage) => void): void {
    if (!this.websocket) {
      throw new ConnectionError(
        'Client is not connected. Configure `ws` and call initialize() first.',
      );
    }

    this.websocket.registerIdentifier(identifier, (websocketMessage) =>
      callback(ReplyMessage.create(this.messages, websocketMessage)),
    );
  }

  /**
   * Checks that the gateway is reachable (`GET /health`) and, when `ws` is
   * configured, connects to the flow-engine socket.
   *
   * @throws InitializationError if either step fails
   */
  async initialize(): Promise<void> {
    try {
      await this.rest.request('/health', { method: 'GET' });
      this.logger.info('Gateway is reachable');

      if (this.options.ws) {
        const websocket = new WebSocketClient(this.options.ws.url, this.options.ws.token);
        await websocket.connect();
        this.websocket = websocket;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to initialize client', error instanceof Error ? error : undefined);
      throw new InitializationError(
        `Failed to initialize client: ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /** Closes the socket connection, if any. */
  disconnect(): void {
    this.websocket?.disconnect();
    this.websocket = null;
  }
}
