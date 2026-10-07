import { FastifyReply, FastifyRequest } from 'fastify';
import { SendMessageDto } from '../../application/dto/message.dto';
import MessageUseCase from '../../application/usecases/message.usecase';
import SendMessageUseCase from '../../application/usecases/send-message.usecase';
import { MessageMapper } from '../mappers/message.mapper';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Parses the body of `POST /message`:
 * `{ author, number, id, token, message }`, where `number` is the recipient,
 * `id` the phone number ID of the sender and `token` its Meta access token.
 */
export function parseSendMessageBody(body: unknown): SendMessageDto | null {
  if (!isObject(body)) return null;

  const { author, number, id, token, message } = body;
  if (
    !isNonEmptyString(author) ||
    !isNonEmptyString(number) ||
    !isNonEmptyString(id) ||
    !isNonEmptyString(token) ||
    !isObject(message)
  ) {
    return null;
  }

  return { author, to: number, phoneNumberId: id, accessToken: token, message };
}

export default class MessageController {
  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly messageUseCase: MessageUseCase,
  ) {}

  /** `GET /messages/:author/:to` */
  async getLastMessages(req: FastifyRequest, res: FastifyReply) {
    const { author, to } = req.params as { author: string; to: string };
    const messages = await this.messageUseCase.getLastMessages(author, to);

    return res.status(200).send(messages.map(MessageMapper.toJSON));
  }

  /** `POST /message` */
  async createMessage(req: FastifyRequest, res: FastifyReply) {
    const dto = parseSendMessageBody(req.body);
    if (!dto) {
      return res.status(400).send({ error: 'Invalid request format' });
    }

    try {
      const message = await this.sendMessageUseCase.execute(dto);
      return res.status(200).send({ status: 'Message sent', id: message.id });
    } catch (error) {
      req.log.error(error, 'Failed to send message');
      return res.status(502).send({ error: 'Failed to send message' });
    }
  }
}
