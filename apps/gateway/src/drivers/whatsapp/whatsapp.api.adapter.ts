import axios, { AxiosInstance } from 'axios';
import { DeliveryConfig, WhatsappApiPort } from '../../application/ports/whatsapp.api.port';

const REQUEST_TIMEOUT_MS = 10000;

/** Raised when the WhatsApp Cloud API does not accept a message. */
export class WhatsappApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'WhatsappApiError';
  }
}

/**
 * Sends messages with the WhatsApp Cloud API
 * (`POST {baseURL}/{phone-number-id}/messages`).
 */
export class WhatsappApiAdapter implements WhatsappApiPort {
  private readonly axiosClient: AxiosInstance;

  /** @param baseURL - Graph API base URL including the version, e.g. `https://graph.facebook.com/v23.0` */
  constructor(baseURL: string) {
    this.axiosClient = axios.create({
      baseURL,
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async sendMessage(config: DeliveryConfig, message: Record<string, unknown>): Promise<void> {
    const { phoneNumberId, to, accessToken } = config;
    const payload = { ...message, messaging_product: 'whatsapp', to };
    const headers = { Authorization: `Bearer ${accessToken}` };

    try {
      await this.axiosClient.post(`/${phoneNumberId}/messages`, payload, { headers });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const details = error.response?.data;
        const reason = details?.error?.message ?? error.message;
        throw new WhatsappApiError(
          `WhatsApp API rejected the message: ${reason}`,
          error.response?.status,
          details,
        );
      }
      throw error;
    }
  }
}
