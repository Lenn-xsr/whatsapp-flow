import axios, { AxiosInstance, AxiosRequestConfig, AxiosHeaders } from 'axios';
import { APIError } from '../errors';
import { getLogger } from '../utils/Logger';

const DEFAULT_TIMEOUT_MS = 30000;

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
}

/** HTTP client for the gateway. Authenticates with `Authorization: Bearer <token>`. */
export class Rest {
  private readonly api: AxiosInstance;
  private readonly logger = getLogger();

  constructor(
    private readonly endpoint: string,
    private readonly token: string,
  ) {
    this.api = axios.create({
      baseURL: this.endpoint,
      headers: new AxiosHeaders({
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      }),
      timeout: DEFAULT_TIMEOUT_MS,
    });
  }

  /**
   * Makes a request to the gateway.
   * @param endpoint - Path relative to the gateway base URL
   * @returns Promise that resolves with the response body
   * @throws APIError if the request fails
   */
  public async request<T>(endpoint: string, options: Partial<RequestOptions> = {}): Promise<T> {
    const method = options.method || 'GET';

    try {
      const config: AxiosRequestConfig = {
        url: endpoint,
        data: options.data,
        method,
        params: options.params || {},
        ...(options.timeout && { timeout: options.timeout }),
      };

      if (options.headers) {
        config.headers = new AxiosHeaders(options.headers);
      }

      this.logger.debug('Gateway request', { method, url: endpoint });
      const response = await this.api.request<T>(config);
      this.logger.debug('Gateway response', { status: response.status, url: endpoint });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const responseData = error.response?.data;
        const errorMessage = responseData?.error || responseData?.message || error.message;

        this.logger.error('Gateway request failed', error);

        throw new APIError(`API Error: ${errorMessage}`, statusCode, responseData);
      }

      this.logger.error(
        'Unexpected error in gateway request',
        error instanceof Error ? error : undefined,
      );
      throw new APIError(
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
