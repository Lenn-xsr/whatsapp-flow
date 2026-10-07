/** A message a user sent earlier, reduced to what the engine looks at. */
export interface HistoryEntry {
  /** WhatsApp message type (`text`, `image`, `interactive`, ...). */
  type: string;
  /** Body of the message when it is a text message. */
  text?: string;
}

export interface MessageHistoryPort {
  /**
   * Messages `author` sent to the business number `to`, newest first.
   * The message being handled is expected to be part of the result.
   */
  getInboundHistory(author: string, to: string): Promise<HistoryEntry[]>;
}
