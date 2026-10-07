import Message from '../../domain/message';
import { HistoryEntry, MessageHistoryPort } from '../ports/message.history.port';
import { DispatchMessageUseCase } from './dispatch-message.usecase';
import { RunFlowUseCase } from './run-flow.usecase';

/** How many identical text messages in a row make the engine stop answering. */
export const REPEATED_MESSAGES_LIMIT = 5;

export type HandlingOutcome =
  'ignored-repetition' | 'dispatched' | 'answered-by-flow' | 'unhandled';

export default class HandleIncomingMessageUseCase {
  constructor(
    private readonly messageHistory: MessageHistoryPort,
    private readonly dispatchMessage: DispatchMessageUseCase,
    private readonly runFlow: RunFlowUseCase,
  ) {}

  /**
   * Whether the latest text messages of the user all say the same thing.
   * Guards against loops with another bot (or an auto-reply) on the other end.
   * @param history - newest first
   */
  private isRepeating(history: HistoryEntry[]): boolean {
    const texts = history.filter((entry) => entry.type === 'text');
    if (texts.length < REPEATED_MESSAGES_LIMIT) return false;

    const latest = texts.slice(0, REPEATED_MESSAGES_LIMIT);
    return latest.every((entry) => entry.text === latest[0]?.text);
  }

  /**
   * Handles a message received from a WhatsApp user:
   *
   * 1. drops it when the user keeps repeating the same text;
   * 2. offers it to external listeners;
   * 3. if none took it, lets the matching flow answer.
   */
  async execute(message: Message): Promise<HandlingOutcome> {
    const history = await this.messageHistory.getInboundHistory(message.author, message.to);

    if (this.isRepeating(history)) {
      return 'ignored-repetition';
    }

    if (await this.dispatchMessage.execute(message)) {
      return 'dispatched';
    }

    // The message being handled is already part of the history.
    const isFirstMessage = history.length <= 1;
    const answered = await this.runFlow.execute(message, isFirstMessage);

    return answered ? 'answered-by-flow' : 'unhandled';
  }
}
