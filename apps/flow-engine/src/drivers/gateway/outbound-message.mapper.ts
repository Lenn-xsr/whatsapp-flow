import {
  AudioMessage,
  Button,
  ButtonMessage,
  ImageMessage,
  InteractionMessage,
  InteractionMessageList,
  Message,
  SelectMenuMessage,
  TemplateMessage,
  TextMessage,
  VideoMessage,
  headerType,
} from '@whatsapp-flow/sdk';
import { InteractionOutput, MediaOutput, SendableOutput } from '../../domain/flow';

/** Title of the single section a list menu is rendered with. */
export const LIST_SECTION_TITLE = 'Options';

const HEADER_TYPES: ReadonlyArray<string> = ['text', 'image', 'video', 'document'];

export interface OutboundMessageOptions {
  /** Language code of the templates referenced by the flows. */
  templateLanguage?: string;
}

function toMediaMessage(output: MediaOutput): Message {
  switch (output.mediaType) {
    case 'audio':
      return new AudioMessage({ link: output.url });
    case 'video':
      return new VideoMessage({ link: output.url });
    case 'image':
      return new ImageMessage({ link: output.url });
  }
}

function toInteractiveMessage(output: InteractionOutput): Message {
  let message: InteractionMessage;

  if (output.interactionType === 'list') {
    const list = new InteractionMessageList(LIST_SECTION_TITLE).addRows(output.options);
    message = new SelectMenuMessage({
      text: output.text,
      list,
      placeholder: output.listButton ?? LIST_SECTION_TITLE,
    });
  } else {
    message = new ButtonMessage({
      text: output.text,
      button: output.options.map((option) => new Button(option.title, option.id)),
    });
  }

  if (output.header && HEADER_TYPES.includes(output.header.type)) {
    message.setHeader(output.header.type as headerType, output.header.value);
  }

  if (output.footer) {
    message.setFooter(output.footer);
  }

  return message;
}

/** Builds the SDK message that renders a flow output on WhatsApp. */
export function toSdkMessage(
  output: SendableOutput,
  options: OutboundMessageOptions = {},
): Message {
  switch (output.kind) {
    case 'text':
      return new TextMessage().setBody(output.text);
    case 'template':
      return new TemplateMessage({
        name: output.name,
        ...(options.templateLanguage ? { language: options.templateLanguage } : {}),
      });
    case 'media':
      return toMediaMessage(output);
    case 'interaction':
      return toInteractiveMessage(output);
  }
}
