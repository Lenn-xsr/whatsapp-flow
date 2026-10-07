import State, { StateStep } from '../../domain/state';

export default interface StateRepositoryPort {
  /** The most recently started conversation of a user among the given flows. */
  findLatestState(number: string, flowIds: string[]): Promise<State | null>;
  /**
   * The conversation of a user in a flow, created if there is none.
   * The boolean tells whether it was just created.
   */
  getOrCreateState(number: string, flowId: string): Promise<[State, boolean]>;
  /** Appends a transition to a conversation. */
  pushStep(id: string, step: StateStep): Promise<void>;
  deleteById(id: string): Promise<void>;
}
