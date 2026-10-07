import { InteractionMessage } from './InteractionMessage';

export interface SelectMenuRow {
  id: string;
  title: string;
  description?: string;
}

/** One section of a list menu: a title and its rows. */
export class InteractionMessageList {
  rows: SelectMenuRow[] = [];
  constructor(public readonly title: string) {}

  addRow(id: string, title: string, description?: string) {
    this.rows.push({
      id,
      title,
      ...(description ? { description } : {}),
    });
    return this;
  }
  addRows(rows: SelectMenuRow[]) {
    this.rows.push(...rows);
    return this;
  }

  toJSON() {
    return {
      title: this.title,
      rows: this.rows,
    };
  }
}

export interface SelectMenuMessageOptions {
  text?: string;
  list?: InteractionMessageList;
  /** Label of the button that opens the list. */
  placeholder?: string;
}

/**
 * Interactive message with a single-section list menu.
 *
 * @example
 * ```typescript
 * const list = new InteractionMessageList('Departments')
 *   .addRow('sales', 'Sales', 'Talk to the sales team')
 *   .addRow('support', 'Support', 'Get help with a product');
 *
 * const message = new SelectMenuMessage({
 *   text: 'How can we help?',
 *   list,
 *   placeholder: 'Choose',
 * });
 * ```
 */
export class SelectMenuMessage extends InteractionMessage {
  constructor(options?: SelectMenuMessageOptions) {
    super({
      type: 'list',
      text: options?.text,
    });
    if (options?.list) {
      this.setSelectMenu(options.list, options.placeholder || '');
    }
  }

  setSelectMenu(list: InteractionMessageList, placeholder: string) {
    this.props.action = {
      button: placeholder,
      sections: [list.toJSON()],
    };
    return this;
  }
}
