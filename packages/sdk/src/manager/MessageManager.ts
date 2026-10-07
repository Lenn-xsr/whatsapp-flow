import type { WhatsappClient } from '../client';
import { Message } from '../structures/Message';
import { SenderNotFoundError } from '../errors';
import { validatePhoneNumber } from '../utils/Validation';

export interface SendMessageOptions {
  message: Message;
  /** Name or number of the configured sender to use. Defaults to the default sender. */
  from?: string;
}

export class MessageManager {
  constructor(private readonly client: Pick<WhatsappClient, 'options' | 'rest'>) {}

  /**
   * Picks the sender for a message: the one matching `options.from` by number
   * or name, otherwise the sender marked as default.
   */
  getSender(options: SendMessageOptions) {
    if (this.client.options.sender instanceof Array) {
      return (
        this.client.options.sender.find(
          (sender) => sender.number === options.from || sender.name === options.from,
        ) || this.client.options.sender.find((sender) => sender.default)
      );
    }

    return this.client.options.sender;
  }

  /**
   * Resolves the sender fields the gateway needs to call the Cloud API.
   * @throws SenderNotFoundError if no sender matches and there is no default
   */
  getAuthor(options: SendMessageOptions) {
    const sender = this.getSender(options);
    if (!sender) {
      throw new SenderNotFoundError(options.from ?? 'default');
    }

    return {
      id: sender.numberID,
      author: sender.number,
      token: sender.token,
    };
  }

  /**
   * Sends a message through the gateway (`POST /message`).
   *
   * @param number - Phone number of the recipient, digits only with country code
   * @throws ValidationError if the phone number is invalid
   * @throws SenderNotFoundError if no sender is found
   * @throws APIError if the gateway rejects the request
   */
  async send(number: string, options: SendMessageOptions): Promise<void> {
    validatePhoneNumber(number, 'recipient number');

    const { author, id, token } = this.getAuthor(options);
    await this.client.rest.request('/message', {
      method: 'POST',
      data: {
        author,
        number,
        id,
        token,
        message: options.message.toJSON(),
      },
    });
  }
}
