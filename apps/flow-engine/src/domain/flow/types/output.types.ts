export type MediaType = 'audio' | 'video' | 'image';

export interface TextOutput {
  kind: 'text';
  text: string;
}

export interface MediaOutput {
  kind: 'media';
  mediaType: MediaType;
  url: string;
}

export interface TemplateOutput {
  kind: 'template';
  /** Name of a template approved in the WhatsApp Business account. */
  name: string;
}

export interface InteractionOption {
  id: string;
  title: string;
  description?: string;
}

export interface InteractionOutput {
  kind: 'interaction';
  /** `list` is a list menu, `button` a set of reply buttons. */
  interactionType: 'list' | 'button';
  text: string;
  header: { type: string; value: string } | null;
  footer: string | null;
  /** Label of the button that opens the list (lists only). */
  listButton?: string;
  options: InteractionOption[];
}

export interface DelayOutput {
  kind: 'delay';
  seconds: number;
}

/** Outputs that become a WhatsApp message. */
export type SendableOutput = TextOutput | MediaOutput | TemplateOutput | InteractionOutput;

/** Everything a flow can ask the engine to do, in order. */
export type FlowOutput = SendableOutput | DelayOutput;
