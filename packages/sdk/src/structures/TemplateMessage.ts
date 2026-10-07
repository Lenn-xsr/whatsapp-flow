import { Message } from './Message';

export type templateComponentType = 'body' | 'header' | 'button';
export type templateParameterMediaType = 'image' | 'video' | 'document';

abstract class TemplateParameter {
  abstract toJSON(): Record<string, unknown>;
}

export class TemplateParameterMedia extends TemplateParameter {
  constructor(
    public readonly type: templateParameterMediaType,
    public readonly url: string,
  ) {
    super();
  }

  toJSON() {
    return {
      type: this.type,
      [this.type]: {
        link: this.url,
      },
    };
  }
}

export class TemplateParameterText extends TemplateParameter {
  constructor(public readonly text: string) {
    super();
  }

  toJSON() {
    return {
      type: 'text',
      text: this.text,
    };
  }
}

export class TemplateMessageComponent {
  constructor(
    public readonly type: templateComponentType,
    public readonly parameters: TemplateParameter[],
  ) {}

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      parameters: this.parameters.map((parameter) => parameter.toJSON()),
    };
  }
}

export class TemplateMessageComponentButton extends TemplateMessageComponent {
  constructor(
    public readonly parameters: TemplateParameter[],
    public readonly subType: string,
    public readonly index: string,
  ) {
    super('button', parameters);
  }

  toJSON() {
    return {
      type: 'button',
      sub_type: this.subType,
      index: this.index,
      parameters: this.parameters.map((parameter) => parameter.toJSON()),
    };
  }
}

export const DEFAULT_TEMPLATE_LANGUAGE = 'en_US';

export interface TemplateMessageOptions {
  name: string;
  /** Language code the template was approved in. Defaults to `en_US`. */
  language?: string;
  components?: TemplateMessageComponent[];
}

/**
 * Message based on a template that was previously approved in the WhatsApp
 * Business account of the sender.
 *
 * @example
 * ```typescript
 * const message = new TemplateMessage({ name: 'order_update', language: 'en_US' })
 *   .setComponents([
 *     new TemplateMessageComponent('body', [new TemplateParameterText('#1234')]),
 *   ]);
 * ```
 */
export class TemplateMessage extends Message {
  constructor(public readonly opts?: TemplateMessageOptions) {
    super('template', {
      name: opts?.name,
      language: {
        code: opts?.language ?? DEFAULT_TEMPLATE_LANGUAGE,
      },
    });

    if (opts?.components) {
      this.setComponents(opts.components);
    }
  }

  setName(name: string) {
    this.props.name = name;
    return this;
  }

  setLanguage(code: string) {
    this.props.language = { code };
    return this;
  }

  setComponents(components: TemplateMessageComponent[]) {
    this.props.components = components.map((component) => component.toJSON());
    return this;
  }
}
