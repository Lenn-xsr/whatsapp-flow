import Message from '../../domain/message';
import { MessageSenderPort } from '../ports/message.sender.port';
import { Conversation } from '../services/conversation';
import { FlowFinder } from '../services/flow-finder';

export type Sleep = (milliseconds: number) => Promise<void>;

const realSleep: Sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

/** Answers an inbound message with the flow that applies to it, if any. */
export class RunFlowUseCase {
  constructor(
    private readonly flowFinder: FlowFinder,
    private readonly conversation: Conversation,
    private readonly sender: MessageSenderPort,
    private readonly sleep: Sleep = realSleep,
  ) {}

  /**
   * @param isFirstMessage - whether this is the first message the user ever
   * sent to the business number
   * @returns whether a flow handled the message
   */
  async execute(message: Message, isFirstMessage: boolean): Promise<boolean> {
    const flow = await this.flowFinder.findFlow(message, isFirstMessage);
    if (!flow) return false;

    const outputs = await this.conversation.respond(message, flow);
    const recipient = { to: message.author, from: message.to };

    // Sent one at a time so the user receives them in the order of the flow.
    for (const output of outputs) {
      if (output.kind === 'delay') {
        await this.sleep(output.seconds * 1000);
        continue;
      }

      await this.sender.send(recipient, output);
    }

    return true;
  }
}
