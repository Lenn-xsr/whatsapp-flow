/** A message to store: who wrote it, who it is for and its content. */
export interface RecordMessageDto {
  author: string;
  to: string;
  message: Record<string, unknown>;
}

/** A message to deliver through the WhatsApp Cloud API and then store. */
export interface SendMessageDto extends RecordMessageDto {
  /** Phone number ID of the sending number in the WhatsApp Cloud API. */
  phoneNumberId: string;
  /** Meta access token allowed to send from that number. */
  accessToken: string;
}
