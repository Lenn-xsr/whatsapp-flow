/**
 * The parts of a WhatsApp Cloud API webhook notification the gateway reads.
 * Everything is optional because the same endpoint also receives delivery
 * status notifications, which carry `statuses` instead of `messages`.
 */
export interface WebhookMessage extends Record<string, unknown> {
  /** Phone number of the WhatsApp user who sent the message. */
  from: string;
}

export interface WebhookChange {
  value?: {
    messages?: WebhookMessage[];
    metadata?: {
      /** Business phone number that received the message. */
      display_phone_number?: string;
    };
  };
}

export interface WebhookEntry {
  changes?: WebhookChange[];
}

export interface WebhookBody {
  entry?: WebhookEntry[];
}
