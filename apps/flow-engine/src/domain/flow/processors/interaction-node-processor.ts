import { ActionValue, FlowNode, InteractionOption, NodeProcessor, NodeResult } from '../types';
import { VariableParser } from '../utils';

/**
 * Presents the options of an interaction node as reply buttons or as a list
 * menu, then waits for the user to pick one.
 *
 * Each option is identified by its label, which is also the key of the link
 * the flow follows when the user selects it.
 */
export class InteractionNodeProcessor implements NodeProcessor {
  constructor(
    private readonly variableParser: VariableParser,
    private readonly vars?: Record<string, string>,
  ) {}

  canProcess(node: Pick<FlowNode, 'extra'>): boolean {
    return node.extra.type === 'interaction';
  }

  process(node: Pick<FlowNode, 'extra'>): NodeResult {
    const { value } = node.extra;

    if (!value || !value.action) {
      throw new Error('Invalid interaction node: missing action');
    }

    const { action, header, footer } = value;
    const isList = action.type === 'list';

    return {
      outputs: [
        {
          kind: 'interaction',
          interactionType: isList ? 'list' : 'button',
          text: value.value ? this.variableParser.parseVars(value.value, this.vars) : '',
          header: header?.value ? { type: header.type, value: header.value } : null,
          footer: footer?.text ? footer.text : null,
          ...(isList && action.button ? { listButton: action.button } : {}),
          options: (action.value ?? []).map((option) => this.toOption(option, isList)),
        },
      ],
      autoAdvance: false,
    };
  }

  private toOption(option: ActionValue, isList: boolean): InteractionOption {
    return {
      id: option.value,
      title: option.value,
      ...(isList && option.subtitle ? { description: option.subtitle } : {}),
    };
  }
}
