import Message from '../../domain/message';
import { SendMessageDto } from '../dto/message.dto';
import { WhatsappApiPort } from '../ports/whatsapp.api.port';
import MessageUseCase from './message.usecase';

export default class SendMessageUseCase {
  constructor(
    private readonly whatsappApi: WhatsappApiPort,
    private readonly messageUseCase: MessageUseCase,
  ) {}

  /**
   * Delivers a message through the WhatsApp Cloud API and stores it once the
   * API has accepted it. Nothing is stored when the delivery fails.
   */
  async execute(dto: SendMessageDto): Promise<Message> {
    await this.whatsappApi.sendMessage(
      {
        accessToken: dto.accessToken,
        phoneNumberId: dto.phoneNumberId,
        to: dto.to,
      },
      dto.message,
    );

    return this.messageUseCase.record({
      author: dto.author,
      to: dto.to,
      message: dto.message,
    });
  }
}
