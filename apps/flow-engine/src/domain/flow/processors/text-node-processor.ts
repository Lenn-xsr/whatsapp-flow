import { FlowNode, FlowOutput, MediaType, NodeMessage, NodeProcessor, NodeResult } from '../types';
import { MediaHandler, VariableParser } from '../utils';

const MEDIA_TYPES: ReadonlyArray<string> = ['audio', 'video', 'image'];

/**
 * Sends the messages of a text node in order. When the last one is a
 * question the engine waits for the answer; otherwise it moves on to the
 * next node right away.
 */
export class TextNodeProcessor implements NodeProcessor {
  constructor(
    private readonly mediaHandler: MediaHandler,
    private readonly variableParser: VariableParser,
    private readonly vars?: Record<string, string>,
  ) {}

  canProcess(node: Pick<FlowNode, 'extra'>): boolean {
    return node.extra.type === 'text';
  }

  process(node: Pick<FlowNode, 'extra'>): NodeResult {
    const messages = node.extra.value?.messages ?? [];

    return {
      outputs: messages.map((message) => this.processNodeMessage(message)),
      autoAdvance: !this.isLastMessageQuestion(messages),
    };
  }

  private isLastMessageQuestion(messages: NodeMessage[]): boolean {
    return messages[messages.length - 1]?.type === 'question';
  }

  private processNodeMessage(message: NodeMessage): FlowOutput {
    if (MEDIA_TYPES.includes(message.type)) {
      return this.mediaHandler.handleMedia(message.type as MediaType, message.value);
    }

    switch (message.type) {
      case 'text':
      case 'question':
        return { kind: 'text', text: this.variableParser.parseVars(message.value, this.vars) };
      case 'template':
        return { kind: 'template', name: message.value };
      case 'delay': {
        const seconds = parseInt(message.value, 10);
        return { kind: 'delay', seconds: Number.isFinite(seconds) && seconds > 0 ? seconds : 0 };
      }
      default:
        throw new Error(`Unsupported message type: ${message.type}`);
    }
  }
}
