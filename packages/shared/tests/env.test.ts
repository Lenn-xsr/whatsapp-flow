import {
  GoogleSecretManagerEnvLoader,
  SecretManagerClient,
  loadEnvironment,
  optionalEnv,
  portEnv,
  requireEnv,
} from '../src/env';

/** In-memory Secret Manager: secret id -> latest value. */
class FakeSecretManager implements SecretManagerClient {
  requestedParents: string[] = [];

  constructor(
    private readonly projectId: string,
    private readonly secrets: Record<string, string | Uint8Array | null>,
  ) {}

  async listSecrets(request: { parent: string }): Promise<[Array<{ name?: string | null }>]> {
    this.requestedParents.push(request.parent);
    return [
      Object.keys(this.secrets).map((id) => ({ name: `projects/${this.projectId}/secrets/${id}` })),
    ];
  }

  async accessSecretVersion(request: {
    name: string;
  }): Promise<[{ payload?: { data?: Uint8Array | string | null } | null }]> {
    const match = /secrets\/([^/]+)\/versions\/latest$/.exec(request.name);
    const id = match?.[1] ?? '';
    return [{ payload: { data: this.secrets[id] ?? null } }];
  }
}

describe('GoogleSecretManagerEnvLoader', () => {
  const variables = ['MONGODB_URI', 'API_KEY', 'EMPTY_SECRET'];

  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    variables.forEach((name) => delete process.env[name]);
    jest.restoreAllMocks();
  });

  it('exposes every secret of the project as an upper-cased environment variable', async () => {
    const client = new FakeSecretManager('demo-project', {
      mongodb_uri: 'mongodb://db/app',
      API_KEY: Buffer.from('secret-key'),
    });

    await new GoogleSecretManagerEnvLoader('demo-project', client).load();

    expect(client.requestedParents).toEqual(['projects/demo-project']);
    expect(process.env.MONGODB_URI).toBe('mongodb://db/app');
    expect(process.env.API_KEY).toBe('secret-key');
  });

  it('skips secrets whose latest version has no payload', async () => {
    const client = new FakeSecretManager('demo-project', { empty_secret: null });

    await new GoogleSecretManagerEnvLoader('demo-project', client).load();

    expect(process.env.EMPTY_SECRET).toBeUndefined();
  });
});

describe('loadEnvironment', () => {
  it('rejects an unknown source', async () => {
    await expect(loadEnvironment({ ENV_SOURCE: 'vault' })).rejects.toThrow('Unknown ENV_SOURCE');
  });

  it('requires the project id when Secret Manager is selected', async () => {
    await expect(loadEnvironment({ ENV_SOURCE: 'gcp-secret-manager' })).rejects.toThrow(
      'GOOGLE_CLOUD_PROJECT',
    );
  });
});

describe('environment helpers', () => {
  it('returns a required variable', () => {
    expect(requireEnv('API_KEY', { API_KEY: 'abc' })).toBe('abc');
  });

  it.each([undefined, '', '   '])('rejects a required variable set to %p', (value) => {
    expect(() => requireEnv('API_KEY', { API_KEY: value })).toThrow(
      'Missing required environment variable API_KEY',
    );
  });

  it('falls back when an optional variable is unset or empty', () => {
    expect(optionalEnv('HOST', '0.0.0.0', {})).toBe('0.0.0.0');
    expect(optionalEnv('HOST', '0.0.0.0', { HOST: '' })).toBe('0.0.0.0');
    expect(optionalEnv('HOST', '0.0.0.0', { HOST: '127.0.0.1' })).toBe('127.0.0.1');
  });

  it('parses a port and falls back when it is unset', () => {
    expect(portEnv('PORT', 3000, { PORT: '8080' })).toBe(8080);
    expect(portEnv('PORT', 3000, {})).toBe(3000);
  });

  it('rejects a port that is not a number', () => {
    expect(() => portEnv('PORT', 3000, { PORT: 'http' })).toThrow('PORT must be a port number');
  });
});
