import { optionalEnv, portEnv, requireEnv } from '@whatsapp-flow/shared';

export interface GatewayConfig {
  port: number;
  host: string;
  corsOrigin: string;
  mongodbUri: string;
  rabbitmqUrl: string;
  /** Key clients send as `Authorization: Bearer <key>`. */
  apiKey: string;
  /** App secret of the Meta app, used to verify webhook signatures. */
  metaAppSecret: string;
  /** Graph API base URL including the version. */
  whatsappApiUrl: string;
}

const DEFAULT_WHATSAPP_API_URL = 'https://graph.facebook.com/v23.0';

/** Reads the configuration once, failing fast on missing variables. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  return {
    port: portEnv('PORT', 3000, env),
    host: optionalEnv('HOST', '0.0.0.0', env),
    corsOrigin: optionalEnv('CORS_ORIGIN', '*', env),
    mongodbUri: requireEnv('MONGODB_URI', env),
    rabbitmqUrl: requireEnv('RABBITMQ_URL', env),
    apiKey: requireEnv('API_KEY', env),
    metaAppSecret: requireEnv('META_APP_SECRET', env),
    whatsappApiUrl: optionalEnv('WHATSAPP_API_URL', DEFAULT_WHATSAPP_API_URL, env),
  };
}
