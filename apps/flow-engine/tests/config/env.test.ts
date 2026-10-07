import { loadConfig } from '../../src/config/env';

const required = {
  MONGODB_URI: 'mongodb://localhost:27017/whatsapp-flow',
  RABBITMQ_URL: 'amqp://localhost',
  SOCKET_AUTH_TOKEN: 'socket-token',
  GATEWAY_URL: 'http://localhost:3000',
  GATEWAY_API_KEY: 'gateway-key',
  WHATSAPP_SENDER_NUMBER: '15550001111',
  WHATSAPP_PHONE_NUMBER_ID: 'phone-number-id',
  WHATSAPP_ACCESS_TOKEN: 'meta-token',
};

describe('flow-engine configuration', () => {
  it('applies the defaults when only the required variables are set', () => {
    expect(loadConfig(required)).toEqual({
      mongodbUri: 'mongodb://localhost:27017/whatsapp-flow',
      rabbitmqUrl: 'amqp://localhost',
      socket: { port: 3001, authToken: 'socket-token', corsOrigin: '*' },
      gateway: { url: 'http://localhost:3000', apiKey: 'gateway-key' },
      sender: { number: '15550001111', numberID: 'phone-number-id', token: 'meta-token' },
      templateLanguage: 'en_US',
    });
  });

  it('reads the optional variables', () => {
    const config = loadConfig({
      ...required,
      SOCKET_PORT: '4001',
      CORS_ORIGIN: 'https://app.example.com',
      MEDIA_BASE_URL: 'https://media.example.com/flows',
      TEMPLATE_LANGUAGE: 'pt_BR',
    });

    expect(config.socket).toEqual({
      port: 4001,
      authToken: 'socket-token',
      corsOrigin: 'https://app.example.com',
    });
    expect(config.mediaBaseUrl).toBe('https://media.example.com/flows');
    expect(config.templateLanguage).toBe('pt_BR');
  });

  it('leaves the media base URL out when it is empty', () => {
    expect(loadConfig({ ...required, MEDIA_BASE_URL: '' })).not.toHaveProperty('mediaBaseUrl');
  });

  it.each(Object.keys(required))('refuses to start without %s', (name) => {
    const env: Record<string, string> = { ...required };
    delete env[name];

    expect(() => loadConfig(env)).toThrow(`Missing required environment variable ${name}`);
  });
});
