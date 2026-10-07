import { loadConfig } from '../../src/config/env';

const required = {
  MONGODB_URI: 'mongodb://localhost:27017/whatsapp-flow',
  RABBITMQ_URL: 'amqp://localhost',
  API_KEY: 'gateway-key',
  META_APP_SECRET: 'app-secret',
};

describe('gateway configuration', () => {
  it('applies the defaults when only the required variables are set', () => {
    expect(loadConfig(required)).toEqual({
      port: 3000,
      host: '0.0.0.0',
      corsOrigin: '*',
      mongodbUri: 'mongodb://localhost:27017/whatsapp-flow',
      rabbitmqUrl: 'amqp://localhost',
      apiKey: 'gateway-key',
      metaAppSecret: 'app-secret',
      whatsappApiUrl: 'https://graph.facebook.com/v23.0',
    });
  });

  it('reads the optional variables', () => {
    const config = loadConfig({
      ...required,
      PORT: '8080',
      HOST: '127.0.0.1',
      CORS_ORIGIN: 'https://app.example.com',
      WHATSAPP_API_URL: 'http://localhost:4000/v1',
    });

    expect(config).toMatchObject({
      port: 8080,
      host: '127.0.0.1',
      corsOrigin: 'https://app.example.com',
      whatsappApiUrl: 'http://localhost:4000/v1',
    });
  });

  it.each(Object.keys(required))('refuses to start without %s', (name) => {
    const env: Record<string, string> = { ...required };
    delete env[name];

    expect(() => loadConfig(env)).toThrow(`Missing required environment variable ${name}`);
  });
});
