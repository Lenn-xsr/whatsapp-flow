/** One transition a user made in a flow. */
export interface StateStep {
  /** Key of the link that was followed out of the node. */
  next: string;
  /** What the user answered to trigger the transition (empty when automatic). */
  response: string;
}

export interface StateProps {
  id: string;
  /** Flow the conversation belongs to. */
  flowId: string;
  /** Phone number of the WhatsApp user. */
  number: string;
  steps: StateStep[];
}

/**
 * Progress of one user in one flow.
 *
 * The position is not stored as a node id: it is the list of transitions
 * taken from the start node, replayed against the flow on every message.
 */
export default class State implements StateProps {
  constructor(public readonly props: StateProps) {}

  get id() {
    return this.props.id;
  }
  get flowId() {
    return this.props.flowId;
  }
  get number() {
    return this.props.number;
  }
  get steps() {
    return this.props.steps;
  }

  static create(props: StateProps): State {
    return new State(props);
  }
}
