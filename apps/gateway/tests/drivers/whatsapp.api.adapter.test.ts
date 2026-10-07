import axios, { AxiosError, AxiosHeaders } from 'axios';
import {
  WhatsappApiAdapter,
  WhatsappApiError,
} from '../../src/drivers/whatsapp/whatsapp.api.adapter';

const config = { accessToken: 'meta-token', phoneNumberId: 'phone-number-id', to: '15550002222' };
const message = { type: 'text', text: { body: 'Hello!' } };

/** An error shaped like the ones axios raises for a non-2xx response. */
const rejection = (status: number, data: unknown): AxiosError => {
  const headers = new AxiosHeaders();
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', { headers }, undefined, {
    status,
    statusText: 'Error',
    data,
    headers,
    config: { headers },
  });
};

describe('WhatsappApiAdapter', () => {
  let post: jest.Mock;
  let create: jest.SpyInstance;

  beforeEach(() => {
    post = jest.fn().mockResolvedValue({ data: { messages: [{ id: 'wamid.1' }] } });
    create = jest.spyOn(axios, 'create').mockReturnValue({ post } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('talks to the configured Graph API base URL', () => {
    new WhatsappApiAdapter('https://graph.example.com/v23.0');

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://graph.example.com/v23.0' }),
    );
  });

  it('posts the message to the phone number of the sender, addressed to the recipient', async () => {
    await new WhatsappApiAdapter('https://graph.example.com/v23.0').sendMessage(config, message);

    expect(post).toHaveBeenCalledWith(
      '/phone-number-id/messages',
      {
        messaging_product: 'whatsapp',
        to: '15550002222',
        type: 'text',
        text: { body: 'Hello!' },
      },
      { headers: { Authorization: 'Bearer meta-token' } },
    );
  });

  it('does not let the message override the recipient or the product', async () => {
    const hostile = { ...message, to: '15550009999', messaging_product: 'instagram' };

    await new WhatsappApiAdapter('https://graph.example.com/v23.0').sendMessage(config, hostile);

    expect(post.mock.calls[0][1]).toMatchObject({
      messaging_product: 'whatsapp',
      to: '15550002222',
    });
  });

  it('reports the reason and status the API gave when it rejects a message', async () => {
    const details = { error: { message: 'Invalid OAuth access token', code: 190 } };
    post.mockRejectedValue(rejection(401, details));

    const sending = new WhatsappApiAdapter('https://graph.example.com/v23.0').sendMessage(
      config,
      message,
    );

    await expect(sending).rejects.toBeInstanceOf(WhatsappApiError);
    await expect(sending).rejects.toMatchObject({
      message: 'WhatsApp API rejected the message: Invalid OAuth access token',
      status: 401,
      details,
    });
  });

  it('passes through failures that did not come from the HTTP client', async () => {
    const failure = new TypeError('unexpected');
    post.mockRejectedValue(failure);

    await expect(
      new WhatsappApiAdapter('https://graph.example.com/v23.0').sendMessage(config, message),
    ).rejects.toBe(failure);
  });
});
