import axios, { AxiosError, AxiosHeaders } from 'axios';
import { Rest } from '../../src/client/Rest';
import { APIError } from '../../src/errors';

/** An error shaped like the ones axios raises for a non-2xx response. */
const rejection = (status: number, data: unknown): AxiosError => {
  const headers = new AxiosHeaders();
  return new AxiosError(
    'Request failed with status code ' + status,
    'ERR_BAD_REQUEST',
    { headers },
    undefined,
    {
      status,
      statusText: 'Error',
      data,
      headers,
      config: { headers },
    },
  );
};

describe('Rest', () => {
  let request: jest.Mock;
  let create: jest.SpyInstance;

  beforeEach(() => {
    request = jest.fn().mockResolvedValue({ status: 200, data: { status: 'ok' } });
    create = jest.spyOn(axios, 'create').mockReturnValue({ request } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('authenticates against the gateway with a bearer token', () => {
    new Rest('http://localhost:3000', 'gateway-key');

    const options = create.mock.calls[0][0];
    expect(options.baseURL).toBe('http://localhost:3000');
    expect(options.headers.get('Authorization')).toBe('Bearer gateway-key');
  });

  it('returns the body of the response', async () => {
    const rest = new Rest('http://localhost:3000', 'gateway-key');

    await expect(rest.request('/health', { method: 'GET' })).resolves.toEqual({ status: 'ok' });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/health', method: 'GET' }),
    );
  });

  it('sends the given data with the given method', async () => {
    const rest = new Rest('http://localhost:3000', 'gateway-key');
    const data = { number: '15550002222' };

    await rest.request('/message', { method: 'POST', data });

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/message', method: 'POST', data }),
    );
  });

  it('turns an error response of the gateway into an APIError with its status and body', async () => {
    request.mockRejectedValue(rejection(401, { error: 'Unauthorized' }));
    const rest = new Rest('http://localhost:3000', 'wrong-key');

    const failed = rest.request('/message', { method: 'POST' });

    await expect(failed).rejects.toBeInstanceOf(APIError);
    await expect(failed).rejects.toMatchObject({
      message: 'API Error: Unauthorized',
      statusCode: 401,
      response: { error: 'Unauthorized' },
    });
  });

  it('falls back to the transport error when there is no response body', async () => {
    request.mockRejectedValue(new AxiosError('connect ECONNREFUSED', 'ECONNREFUSED'));
    const rest = new Rest('http://localhost:3000', 'gateway-key');

    await expect(rest.request('/health')).rejects.toMatchObject({
      message: 'API Error: connect ECONNREFUSED',
      statusCode: undefined,
    });
  });

  it('wraps unexpected failures in an APIError too', async () => {
    request.mockRejectedValue(new TypeError('boom'));
    const rest = new Rest('http://localhost:3000', 'gateway-key');

    await expect(rest.request('/health')).rejects.toMatchObject({
      name: 'APIError',
      message: 'Unexpected error: boom',
    });
  });
});
