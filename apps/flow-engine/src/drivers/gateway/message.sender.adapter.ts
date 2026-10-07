import { Sender, WhatsappClient } from '@whatsapp-flow/sdk';
import { MessageSenderPort, Recipient } from '../../application/ports/message.sender.port';
import { SendableOutput } from '../../domain/flow';
import { OutboundMessageOptions, toSdkMessage } from './outbound-message.mapper';

export interface MessageSenderConfig extends OutboundMessageOptions {
  gatewayUrl: string;
  gatewayApiKey: string;
  /** The WhatsApp Business number the flows answer from. */
  sender: Pick<Sender, 'number' | 'numberID' | 'token'>;
}

/** Sends flow outputs through the gateway, using the SDK as HTTP client. */
export class MessageSenderAdapter implements MessageSenderPort {
  private readonly client: WhatsappClient;

  constructor(private readonly config: MessageSenderConfig) {
    this.client = new WhatsappClient({
      sender: { ...config.sender, name: 'flow-engine', default: true },
      rest: {
        url: config.gatewayUrl,
        token: config.gatewayApiKey,
      },
    });
  }

  async send(recipient: Recipient, output: SendableOutput): Promise<void> {
    await this.client.messages.send(recipient.to, {
      message: toSdkMessage(output, this.config),
      from: recipient.from,
    });
  }
}
