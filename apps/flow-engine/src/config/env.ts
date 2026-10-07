import { optionalEnv, portEnv, requireEnv } from '@whatsapp-flow/shared';

export interface FlowEngineConfig {
  mongodbUri: string;
  rabbitmqUrl: string;
  socket: {
    port: number;
    /** Token socket.io clients must send in the handshake. */
    authToken: string;
    corsOrigin: string;
  };
  gateway: {
    url: string;
    apiKey: string;
  };
  /** The WhatsApp Business number the flows answer from. */
  sender: {
    number: string;
    numberID: string;
    token: string;
  };
  /** Where the media referenced by flows is hosted (optional). */
  mediaBaseUrl?: string;
  /** Language code of the templates referenced by flows. */
  templateLanguage: string;
}

/** Reads the configuration once, failing fast on missing variables. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): FlowEngineConfig {
  const mediaBaseUrl = optionalEnv('MEDIA_BASE_URL', '', env);

  return {
    mongodbUri: requireEnv('MONGODB_URI', env),
    rabbitmqUrl: requireEnv('RABBITMQ_URL', env),
    socket: {
      port: portEnv('SOCKET_PORT', 3001, env),
      authToken: requireEnv('SOCKET_AUTH_TOKEN', env),
      corsOrigin: optionalEnv('CORS_ORIGIN', '*', env),
    },
    gateway: {
      url: requireEnv('GATEWAY_URL', env),
      apiKey: requireEnv('GATEWAY_API_KEY', env),
    },
    sender: {
      number: requireEnv('WHATSAPP_SENDER_NUMBER', env),
      numberID: requireEnv('WHATSAPP_PHONE_NUMBER_ID', env),
      token: requireEnv('WHATSAPP_ACCESS_TOKEN', env),
    },
    ...(mediaBaseUrl ? { mediaBaseUrl } : {}),
    templateLanguage: optionalEnv('TEMPLATE_LANGUAGE', 'en_US', env),
  };
}
