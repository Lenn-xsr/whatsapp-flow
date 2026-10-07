import Flow, { getFallbackSearchType } from '../../domain/flow';
import Message from '../../domain/message';
import FlowRepositoryPort from '../ports/flow.repository.port';
import StateRepositoryPort from '../ports/state.repository.port';

/** Decides which flow, if any, answers an inbound message. */
export class FlowFinder {
  constructor(
    private readonly flowRepo: FlowRepositoryPort,
    private readonly stateRepo: StateRepositoryPort,
  ) {}

  /**
   * Among the flows of the business number that was contacted, picks:
   *
   * 1. a flow with a keyword trigger matching what the user sent;
   * 2. otherwise the flow of the conversation the user has in progress;
   * 3. otherwise the fallback flow: the one with a `default` trigger for the
   *    first message a user ever sends, the one with a `state` trigger after.
   */
  async findFlow(message: Message, isFirstMessage: boolean): Promise<Flow | undefined> {
    const flows = await this.flowRepo.getByNumber(message.to);
    if (flows.length === 0) return undefined;

    const triggered = flows.find((flow) => flow.matches(message.response));
    if (triggered) return triggered;

    const state = await this.stateRepo.findLatestState(
      message.author,
      flows.map((flow) => flow.id),
    );
    const inProgress = state && flows.find((flow) => flow.id === state.flowId);
    if (inProgress) return inProgress;

    const fallback = getFallbackSearchType(isFirstMessage);
    return flows.find((flow) => flow.hasSearchType(fallback));
  }
}
