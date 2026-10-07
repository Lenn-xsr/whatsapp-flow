import Flow from './flow.model';
import { FlowNavigationService } from './flow-navigation.service';
import { DelayNodeProcessor, InteractionNodeProcessor, TextNodeProcessor } from './processors';
import { FlowNode, FlowOutput, NodeProcessor } from './types';
import { MediaHandler, VariableParser } from './utils';
import { StateStep } from '../state';

/** Id of the node every flow starts at. */
export const START_NODE_ID = 0;

export interface FlowServiceOptions {
  /** Values for `${name}` placeholders in texts. */
  vars?: Record<string, string>;
  /** Where the media referenced by the flow is hosted. */
  mediaBaseUrl?: string;
}

/**
 * A position in a flow: what to send when the conversation arrives at a node
 * and where it can go next.
 */
export interface Stage {
  nodeId: number;
  outputs: FlowOutput[];
  /** Whether to continue to `next.default` without waiting for an answer. */
  autoAdvance: boolean;
  /**
   * Ways out of the node, keyed by the answer that selects them (`default`
   * for nodes without options). Empty when the flow ends here. Stages are
   * resolved on demand, so flows may contain cycles.
   */
  next: Record<string, () => Stage>;
}

/** Walks a flow graph, turning nodes into stages. */
export class FlowService {
  private readonly nodeProcessors: NodeProcessor[];
  private readonly navigationService: FlowNavigationService;

  constructor(flow: Flow, options: FlowServiceOptions = {}) {
    const variableParser = new VariableParser();
    const mediaHandler = new MediaHandler(flow.id, options.mediaBaseUrl);

    this.navigationService = new FlowNavigationService(flow);
    this.nodeProcessors = [
      new TextNodeProcessor(mediaHandler, variableParser, options.vars),
      new InteractionNodeProcessor(variableParser, options.vars),
      new DelayNodeProcessor(),
    ];
  }

  /** The stage a new conversation begins at. */
  public start(): Stage {
    return this.stageAt(START_NODE_ID);
  }

  /**
   * The stage a conversation is at after taking `steps` from the start. A
   * step whose link no longer exists (the flow was edited) is skipped.
   */
  public getStage(steps: StateStep[]): Stage {
    return steps.reduce((stage, step) => stage.next[step.next]?.() ?? stage, this.start());
  }

  private stageAt(nodeId: number): Stage {
    const node = this.navigationService.getNode(nodeId);
    const { outputs, autoAdvance } = this.findProcessor(node).process(node);

    const next: Record<string, () => Stage> = {};
    for (const [key, targetId] of Object.entries(this.navigationService.getNextNodeIds(node))) {
      next[key] = () => this.stageAt(targetId);
    }

    return { nodeId, outputs, autoAdvance, next };
  }

  private findProcessor(node: FlowNode): NodeProcessor {
    const processor = this.nodeProcessors.find((processor) => processor.canProcess(node));
    if (!processor) {
      throw new Error(`No processor found for node type: ${node.extra?.type}`);
    }
    return processor;
  }
}
