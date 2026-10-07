/**
 * Base class for every outbound message.
 *
 * A message is a `type` plus the properties that go under that key in the
 * WhatsApp Cloud API payload, e.g. `{ type: 'text', text: { body: 'hi' } }`.
 * The gateway adds `messaging_product` and `to` before forwarding it to Meta.
 */
export abstract class Message {
  message: Record<string, unknown> = {};
  props: Record<string, unknown> = {};

  constructor(
    public readonly type: string,
    props?: Record<string, unknown>,
  ) {
    this.props = props || {};
    this.message = {
      [type]: this.props,
    };
  }

  /**
   * Returns the payload as a plain object (`{ type, [type]: props }`), so the
   * message can be passed straight to `JSON.stringify`.
   */
  toJSON(): Record<string, unknown> {
    return { type: this.type, ...this.message };
  }
}
