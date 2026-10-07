import axios, { AxiosInstance } from 'axios';
import { HistoryEntry, MessageHistoryPort } from '../../application/ports/message.history.port';

/** A stored message as returned by the gateway (`GET /messages/:author/:to`). */
interface GatewayMessage {
  message?: {
    type?: unknown;
    text?: { body?: unknown };
    [key: string]: unknown;
  };
}

export function toHistoryEntry(stored: GatewayMessage): HistoryEntry {
  const type = typeof stored.message?.type === 'string' ? stored.message.type : 'unknown';
  const body = stored.message?.text?.body;

  return typeof body === 'string' ? { type, text: body } : { type };
}

/** Reads the message history kept by the gateway. */
export class MessageHistoryAdapter implements MessageHistoryPort {
  private readonly axiosClient: AxiosInstance;

  constructor(gatewayUrl: string, apiKey: string) {
    this.axiosClient = axios.create({
      baseURL: gatewayUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  async getInboundHistory(author: string, to: string): Promise<HistoryEntry[]> {
    const response = await this.axiosClient.get<GatewayMessage[]>(
      `/messages/${encodeURIComponent(author)}/${encodeURIComponent(to)}`,
    );

    return response.data.map(toHistoryEntry);
  }
}
