import Message, { MessageContent } from '../../src/domain/message';
import { buttonReply, listReply, templateButton, text } from '../support/messages';

describe('Message', () => {
  describe('response', () => {
    it('is the body of a text message', () => {
      expect(text('Hello there').response).toBe('Hello there');
    });

    it('is the title of the reply button that was tapped', () => {
      expect(buttonReply('Opening hours', 'hours').response).toBe('Opening hours');
    });

    it('is the title of the list row that was picked', () => {
      expect(listReply('Support', 'support-row').response).toBe('Support');
    });

    it('is the text of a template quick-reply button', () => {
      expect(templateButton('Stop promotions').response).toBe('Stop promotions');
    });

    it('is empty for an interactive message without the reply it announces', () => {
      const message = Message.create({
        id: 'm1',
        author: '15550002222',
        to: '15550001111',
        date: new Date(),
        message: { type: 'interactive', interactive: { type: 'nfm_reply' } },
      });

      expect(message.response).toBe('');
      expect(message.interactiveReply).toBeUndefined();
    });
  });

  describe('interactiveReply', () => {
    it('exposes the id and title of the selected option', () => {
      expect(buttonReply('Yes', 'confirm-yes').interactiveReply).toEqual({
        id: 'confirm-yes',
        title: 'Yes',
      });
    });

    it('is undefined for other message types', () => {
      expect(text('Yes').interactiveReply).toBeUndefined();
    });
  });

  describe('create', () => {
    const props = (message: unknown) => ({
      id: 'm1',
      author: '15550002222',
      to: '15550001111',
      date: new Date(),
      message: message as MessageContent,
    });

    it.each(['image', 'audio', 'location', 'reaction'])('rejects %s messages', (type) => {
      expect(() => Message.create(props({ type, [type]: {} }))).toThrow(
        `Unsupported message type: ${type}`,
      );
    });

    it('rejects a message without content', () => {
      expect(() => Message.create(props(undefined))).toThrow('Unsupported message type');
    });
  });
});
