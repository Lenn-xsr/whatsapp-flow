import { InteractionMessage } from './InteractionMessage';

export class Button {
  constructor(
    public readonly title: string,
    public readonly id: string,
  ) {}

  toJSON() {
    return {
      type: 'reply',
      reply: {
        title: this.title,
        id: this.id,
      },
    };
  }
}

export interface ButtonMessageOptions {
  text?: string;
  button: Button[] | { title: string; id: string }[];
}

/**
 * Interactive message with reply buttons.
 *
 * @example
 * ```typescript
 * const message = new ButtonMessage({
 *   text: 'Do you confirm?',
 *   button: [new Button('Yes', 'yes'), new Button('No', 'no')],
 * });
 * ```
 */
export class ButtonMessage extends InteractionMessage {
  constructor(options?: ButtonMessageOptions) {
    super({
      type: 'button',
      text: options?.text,
    });

    if (options?.button) {
      this.setButtons(options.button);
    }
  }

  setButtons(button: Button[] | { title: string; id: string }[]) {
    this.props.action = {
      buttons: button
        .map((b) => (b instanceof Button ? b : new Button(b.title, b.id)))
        .map((b) => b.toJSON()),
    };
    return this;
  }
}
