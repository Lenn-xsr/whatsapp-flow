import FlowRepositoryPort from '../../src/application/ports/flow.repository.port';
import { HistoryEntry, MessageHistoryPort } from '../../src/application/ports/message.history.port';
import {
  MessageIdentifier,
  MessageListenerPort,
} from '../../src/application/ports/message.listener.port';
import { MessageSenderPort, Recipient } from '../../src/application/ports/message.sender.port';
import StateRepositoryPort from '../../src/application/ports/state.repository.port';
import Flow, { SendableOutput } from '../../src/domain/flow';
import Message from '../../src/domain/message';
import State, { StateStep } from '../../src/domain/state';

export class InMemoryFlowRepository implements FlowRepositoryPort {
  constructor(public flows: Flow[] = []) {}

  async getByNumber(number: string): Promise<Flow[]> {
    return this.flows.filter((flow) => flow.number === number);
  }
}

/** Conversation states kept in an array, oldest first. */
export class InMemoryStateRepository implements StateRepositoryPort {
  states: State[] = [];
  private sequence = 0;

  /** Convenience for assertions: the steps of the only conversation of a user in a flow. */
  stepsOf(number: string, flowId: string): StateStep[] | undefined {
    return this.states.find((state) => state.number === number && state.flowId === flowId)?.steps;
  }

  /** Puts a conversation in a given position, as if earlier messages had led there. */
  seed(number: string, flowId: string, steps: StateStep[] = []): State {
    this.sequence += 1;
    const state = State.create({ id: `state-${this.sequence}`, flowId, number, steps: [...steps] });
    this.states.push(state);
    return state;
  }

  async findLatestState(number: string, flowIds: string[]): Promise<State | null> {
    const candidates = this.states.filter(
      (state) => state.number === number && flowIds.includes(state.flowId),
    );
    return candidates[candidates.length - 1] ?? null;
  }

  async getOrCreateState(number: string, flowId: string): Promise<[State, boolean]> {
    const existing = this.states.find(
      (state) => state.number === number && state.flowId === flowId,
    );
    if (existing) return [existing, false];

    return [this.seed(number, flowId), true];
  }

  async pushStep(id: string, step: StateStep): Promise<void> {
    const state = this.states.find((candidate) => candidate.id === id);
    if (!state) throw new Error('State not found');
    state.steps.push(step);
  }

  async deleteById(id: string): Promise<void> {
    this.states = this.states.filter((state) => state.id !== id);
  }
}

/** History that the test fills in, newest first. */
export class FakeMessageHistory implements MessageHistoryPort {
  entries: HistoryEntry[] = [];
  requests: Array<{ author: string; to: string }> = [];

  async getInboundHistory(author: string, to: string): Promise<HistoryEntry[]> {
    this.requests.push({ author, to });
    return this.entries;
  }
}

/** External listeners: takes the messages whose content is in `subscriptions`. */
export class FakeMessageListeners implements MessageListenerPort {
  subscriptions: string[] = [];
  offered: Array<{ identifier: MessageIdentifier; message: Message }> = [];

  async deliver(identifier: MessageIdentifier, message: Message): Promise<boolean> {
    this.offered.push({ identifier, message });
    return this.subscriptions.includes(identifier.content);
  }
}

/** Sender that remembers what was sent, in order, and can be told to fail. */
export class RecordingMessageSender implements MessageSenderPort {
  sent: Array<{ recipient: Recipient; output: SendableOutput }> = [];
  failure: Error | null = null;

  async send(recipient: Recipient, output: SendableOutput): Promise<void> {
    if (this.failure) throw this.failure;
    this.sent.push({ recipient, output });
  }

  /** The text of every text message sent so far. */
  get texts(): string[] {
    return this.sent.flatMap(({ output }) => (output.kind === 'text' ? [output.text] : []));
  }

  clear(): void {
    this.sent = [];
  }
}
