import { FastifyReply, FastifyRequest } from 'fastify';
import SignatureValidatorPort from '../../application/ports/signature.validator.port';
import MessageUseCase from '../../application/usecases/message.usecase';
import { extractInboundMessages } from '../mappers/webhook.mapper';

const firstHeader = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export default class WebhookController {
  constructor(
    private readonly messageUseCase: MessageUseCase,
    private readonly signatureValidator: SignatureValidatorPort,
  ) {}

  /**
   * `POST /webhook`: receives WhatsApp Cloud API notifications.
   *
   * The signature is checked against the raw body before anything is read
   * from the payload. Notifications without user messages are acknowledged
   * with 200 so Meta does not retry them.
   */
  async execute(req: FastifyRequest, res: FastifyReply) {
    if (typeof req.rawBody !== 'string') {
      return res.code(400).send({ error: 'Invalid request format' });
    }

    const signature =
      firstHeader(req.headers['x-hub-signature-256']) ??
      firstHeader(req.headers['x-hub-signature']);

    if (!this.signatureValidator.isValidSignature(req.rawBody, signature)) {
      return res.code(401).send({ error: 'Invalid signature' });
    }

    const messages = extractInboundMessages(req.body);
    if (messages.length === 0) {
      return res.code(200).send({ status: 'Ignored' });
    }

    try {
      for (const message of messages) {
        await this.messageUseCase.receive(message);
      }
    } catch (error) {
      req.log.error(error, 'Failed to process webhook');
      return res.code(500).send({ error: 'Internal server error' });
    }

    return res.code(200).send({ status: 'Message processed successfully' });
  }
}
