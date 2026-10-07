import Flow, {
  DEFAULT_LINK,
  FlowOutput,
  FlowService,
  FlowServiceOptions,
  Stage,
} from '../../domain/flow';
import Message from '../../domain/message';
import State from '../../domain/state';
import StateRepositoryPort from '../ports/state.repository.port';

/** Upper bound of nodes chained without user input, to stop cyclic flows. */
export const MAX_AUTOMATIC_STEPS = 50;

/**
 * Advances the conversation a user has with a flow and returns what the
 * flow wants to send in response to a message.
 */
export class Conversation {
  constructor(
    private readonly stateRepo: StateRepositoryPort,
    private readonly flowOptions: FlowServiceOptions = {},
  ) {}

  async respond(message: Message, flow: Flow): Promise<FlowOutput[]> {
    const service = new FlowService(flow, this.flowOptions);
    const [state, isNew] = await this.stateRepo.getOrCreateState(message.author, flow.id);

    if (isNew) {
      return this.enter(state, service.start());
    }

    const current = service.getStage(state.steps);

    if (Object.keys(current.next).length === 0) {
      // Leftover of a conversation that already ended: start over.
      await this.stateRepo.deleteById(state.id);
      return this.respond(message, flow);
    }

    const key = current.next[message.response] ? message.response : DEFAULT_LINK;
    const next = current.next[key];
    if (!next) {
      // The answer is not one of the options: stay on the node and wait.
      return [];
    }

    await this.stateRepo.pushStep(state.id, { response: message.response, next: key });

    return this.enter(state, next());
  }

  /**
   * Collects the outputs of a stage and of every stage reached without user
   * input, recording the automatic transitions. The conversation is deleted
   * when it reaches a node the flow cannot leave.
   */
  private async enter(state: State, entered: Stage): Promise<FlowOutput[]> {
    const outputs: FlowOutput[] = [];
    let stage = entered;

    for (let automaticSteps = 0; ; automaticSteps++) {
      outputs.push(...stage.outputs);

      const next = stage.autoAdvance ? stage.next[DEFAULT_LINK] : undefined;
      if (!next) break;

      if (automaticSteps >= MAX_AUTOMATIC_STEPS) {
        throw new Error(
          `Flow ${state.flowId} chains more than ${MAX_AUTOMATIC_STEPS} nodes without waiting for the user`,
        );
      }

      await this.stateRepo.pushStep(state.id, { response: '', next: DEFAULT_LINK });
      stage = next();
    }

    if (Object.keys(stage.next).length === 0) {
      await this.stateRepo.deleteById(state.id);
    }

    return outputs;
  }
}
