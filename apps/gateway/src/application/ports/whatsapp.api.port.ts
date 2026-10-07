export interface DeliveryConfig {
  /** Meta access token allowed to send from the phone number. */
  accessToken: string;
  /** Phone number ID of the sending number in the WhatsApp Cloud API. */
  phoneNumberId: string;
  /** Phone number of the recipient. */
  to: string;
}

export interface WhatsappApiPort {
  /**
   * Delivers a message object (`{ type, [type]: {...} }`) to the recipient.
   * Rejects when the API does not accept the message.
   */
  sendMessage(config: DeliveryConfig, message: Record<string, unknown>): Promise<void>;
}
