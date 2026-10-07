import { RecordMessageDto } from '../../application/dto/message.dto';
import { WebhookBody, WebhookMessage } from '../dto/webhook.dto';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isWebhookMessage = (value: unknown): value is WebhookMessage =>
  isObject(value) && typeof value.from === 'string' && value.from.length > 0;

/**
 * Extracts the user messages from a webhook notification.
 *
 * A notification can batch several entries, changes and messages. Changes
 * without messages (delivery statuses, for instance) or without the receiving
 * phone number are skipped, so an unrelated notification yields an empty list.
 */
export function extractInboundMessages(body: unknown): RecordMessageDto[] {
  if (!isObject(body)) return [];

  const entries = (body as WebhookBody).entry;
  if (!Array.isArray(entries)) return [];

  const messages: RecordMessageDto[] = [];

  for (const entry of entries) {
    if (!isObject(entry) || !Array.isArray(entry.changes)) continue;

    for (const change of entry.changes) {
      const value = isObject(change) ? change.value : undefined;
      if (!isObject(value) || !Array.isArray(value.messages)) continue;

      const receiver = isObject(value.metadata) ? value.metadata.display_phone_number : undefined;
      if (typeof receiver !== 'string' || receiver.length === 0) continue;

      for (const message of value.messages) {
        if (!isWebhookMessage(message)) continue;

        messages.push({ author: message.from, to: receiver, message });
      }
    }
  }

  return messages;
}
