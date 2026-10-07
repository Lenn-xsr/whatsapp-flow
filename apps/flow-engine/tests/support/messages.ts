import Message, { MessageContent } from '../../src/domain/message';
import { BUSINESS, CUSTOMER } from './flows';

let sequence = 0;

const inbound = (message: MessageContent, author = CUSTOMER, to = BUSINESS): Message => {
  sequence += 1;
  return Message.create({
    id: `message-${sequence}`,
    author,
    to,
    date: new Date('2024-01-01T10:00:00.000Z'),
    message,
  });
};

/** A text message from the customer. */
export const text = (body: string, author?: string, to?: string): Message =>
  inbound({ type: 'text', text: { body } }, author, to);

/** The customer tapped a reply button. */
export const buttonReply = (title: string, id = title): Message =>
  inbound({
    type: 'interactive',
    interactive: { type: 'button_reply', button_reply: { id, title } },
  });

/** The customer picked a row of a list menu. */
export const listReply = (title: string, id = title): Message =>
  inbound({
    type: 'interactive',
    interactive: { type: 'list_reply', list_reply: { id, title } },
  });

/** The customer tapped a quick-reply button of a template. */
export const templateButton = (buttonText: string): Message =>
  inbound({ type: 'button', button: { text: buttonText } });
