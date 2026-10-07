import { createLogger } from './logger';

const logger = createLogger('env');

/** Populates `process.env` before the application reads its configuration. */
export interface EnvLoader {
  load(): Promise<void>;
}

/** Loads variables from the `.env` file in the current working directory. */
export class DotenvEnvLoader implements EnvLoader {
  async load(): Promise<void> {
    const { config } = await import('dotenv');
    const { error } = config();

    logger.info(
      error ? 'No .env file found, using the process environment' : 'Environment loaded from .env',
    );
  }
}

/** The subset of the Secret Manager client this loader depends on. */
export interface SecretManagerClient {
  listSecrets(request: {
    parent: string;
  }): Promise<[Array<{ name?: string | null }>, ...unknown[]]>;
  accessSecretVersion(request: {
    name: string;
  }): Promise<[{ payload?: { data?: Uint8Array | string | null } | null }, ...unknown[]]>;
}

/**
 * Loads every secret of a Google Cloud project into `process.env`.
 *
 * The secret id becomes the variable name in upper case and the value is the
 * latest version of the secret. Credentials are resolved by the Google client
 * library (Application Default Credentials).
 */
export class GoogleSecretManagerEnvLoader implements EnvLoader {
  constructor(
    private readonly projectId: string,
    private readonly client?: SecretManagerClient,
  ) {}

  private async getClient(): Promise<SecretManagerClient> {
    if (this.client) return this.client;

    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    return new SecretManagerServiceClient() as unknown as SecretManagerClient;
  }

  async load(): Promise<void> {
    const client = await this.getClient();
    const [secrets] = await client.listSecrets({ parent: `projects/${this.projectId}` });

    for (const secret of secrets) {
      if (!secret.name) continue;

      const variable = secret.name.split('/').pop()?.toUpperCase();
      if (!variable) continue;

      const [version] = await client.accessSecretVersion({
        name: `${secret.name}/versions/latest`,
      });

      const data = version.payload?.data;
      if (data === undefined || data === null) continue;

      process.env[variable] = typeof data === 'string' ? data : Buffer.from(data).toString('utf8');
    }

    logger.info(`Environment loaded from Secret Manager project "${this.projectId}"`);
  }
}

/**
 * Loads the environment from the source selected by `ENV_SOURCE`:
 * - `dotenv` (default): the local `.env` file;
 * - `gcp-secret-manager`: the secrets of the project in `GOOGLE_CLOUD_PROJECT`.
 */
export async function loadEnvironment(env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const source = env.ENV_SOURCE ?? 'dotenv';

  switch (source) {
    case 'dotenv':
      return new DotenvEnvLoader().load();
    case 'gcp-secret-manager':
      return new GoogleSecretManagerEnvLoader(requireEnv('GOOGLE_CLOUD_PROJECT', env)).load();
    default:
      throw new Error(`Unknown ENV_SOURCE "${source}". Expected "dotenv" or "gcp-secret-manager".`);
  }
}

/** Returns the variable or throws naming the variable that is missing. */
export function requireEnv(name: string, env: NodeJS.ProcessEnv = process.env): string {
  const value = env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

/** Returns the variable, or `fallback` when it is unset or empty. */
export function optionalEnv(
  name: string,
  fallback: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const value = env[name];
  return value === undefined || value.trim() === '' ? fallback : value;
}

/** Reads a TCP port number, falling back when the variable is unset. */
export function portEnv(
  name: string,
  fallback: number,
  env: NodeJS.ProcessEnv = process.env,
): number {
  const raw = env[name];
  if (raw === undefined || raw.trim() === '') return fallback;

  const port = Number(raw);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Environment variable ${name} must be a port number, got "${raw}"`);
  }
  return port;
}
