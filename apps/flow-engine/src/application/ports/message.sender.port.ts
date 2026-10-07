import { SendableOutput } from '../../domain/flow';

export interface Recipient {
  /** Phone number of the WhatsApp user. */
  to: string;
  /** Business phone number the user is talking to. */
  from: string;
}

export interface MessageSenderPort {
  /** Sends one flow output to a WhatsApp user. */
  send(recipient: Recipient, output: SendableOutput): Promise<void>;
}
