import {
  InteractionMessage,
  InteractionMessageOptions,
} from '../../src/structures/InteractionMessage';

// Create a concrete implementation for testing the abstract class
class TestInteractionMessage extends InteractionMessage {
  constructor(options: InteractionMessageOptions) {
    super(options);
  }
}

describe('InteractionMessage', () => {
  describe('constructor', () => {
    it('should create an interaction message with button type', () => {
      const message = new TestInteractionMessage({
        type: 'button',
        text: 'Choose an option',
      });

      expect(message.type).toBe('interactive');
      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.type).toBe('button');
      expect(json.interactive.body.text).toBe('Choose an option');
    });

    it('should create an interaction message with list type', () => {
      const message = new TestInteractionMessage({
        type: 'list',
        text: 'Select from list',
      });

      expect(message.type).toBe('interactive');
      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.type).toBe('list');
      expect(json.interactive.body.text).toBe('Select from list');
    });

    it('should create an interaction message without text', () => {
      const message = new TestInteractionMessage({
        type: 'button',
      });

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.type).toBe('button');
      expect(json.interactive.body.text).toBeUndefined();
    });

    it('should handle undefined text', () => {
      const message = new TestInteractionMessage({
        type: 'list',
        text: undefined,
      });

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.body.text).toBeUndefined();
    });
  });

  describe('setText', () => {
    it('should set text content', () => {
      const message = new TestInteractionMessage({ type: 'button' });
      const result = message.setText('New text content');

      expect(result).toBe(message); // Should return this for chaining

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.body.text).toBe('New text content');
    });

    it('should update existing text', () => {
      const message = new TestInteractionMessage({
        type: 'button',
        text: 'Old text',
      });

      message.setText('Updated text');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.body.text).toBe('Updated text');
    });

    it('should handle empty string', () => {
      const message = new TestInteractionMessage({ type: 'list' });

      message.setText('');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.body.text).toBe('');
    });

    it('should handle special characters and emojis', () => {
      const message = new TestInteractionMessage({ type: 'button' });

      message.setText('🎉 Special text with émojis! 🚀');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.body.text).toBe('🎉 Special text with émojis! 🚀');
    });
  });

  describe('setFooter', () => {
    it('should set footer text', () => {
      const message = new TestInteractionMessage({ type: 'button' });
      const result = message.setFooter('Footer text');

      expect(result).toBe(message); // Should return this for chaining

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.footer.text).toBe('Footer text');
    });

    it('should update existing footer', () => {
      const message = new TestInteractionMessage({ type: 'list' });

      message.setFooter('First footer');
      message.setFooter('Updated footer');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.footer.text).toBe('Updated footer');
    });

    it('should handle empty footer', () => {
      const message = new TestInteractionMessage({ type: 'button' });

      message.setFooter('');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.footer.text).toBe('');
    });

    it('should handle footer with special characters', () => {
      const message = new TestInteractionMessage({ type: 'list' });

      message.setFooter('Footer with émojis 📝 and symbols!');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.footer.text).toBe('Footer with émojis 📝 and symbols!');
    });
  });

  describe('setHeader', () => {
    it('should set text header', () => {
      const message = new TestInteractionMessage({ type: 'button' });
      const result = message.setHeader('text', 'Header text');

      expect(result).toBe(message); // Should return this for chaining

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.header.type).toBe('text');
      expect(json.interactive.header.text).toBe('Header text');
    });

    it('should set image header', () => {
      const message = new TestInteractionMessage({ type: 'list' });

      message.setHeader('image', 'https://example.com/image.jpg');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.header.type).toBe('image');
      expect(json.interactive.header.image.link).toBe('https://example.com/image.jpg');
      expect(json.interactive.header.text).toBeUndefined();
    });

    it('should set video header', () => {
      const message = new TestInteractionMessage({ type: 'button' });

      message.setHeader('video', 'https://example.com/video.mp4');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.header.type).toBe('video');
      expect(json.interactive.header.video.link).toBe('https://example.com/video.mp4');
    });

    it('should set document header', () => {
      const message = new TestInteractionMessage({ type: 'list' });

      message.setHeader('document', 'https://example.com/doc.pdf');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.header.type).toBe('document');
      expect(json.interactive.header.document.link).toBe('https://example.com/doc.pdf');
    });

    it('should update existing header', () => {
      const message = new TestInteractionMessage({ type: 'button' });

      message.setHeader('text', 'First header');
      message.setHeader('image', 'https://example.com/new-image.jpg');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.header.type).toBe('image');
      expect(json.interactive.header.image.link).toBe('https://example.com/new-image.jpg');
      expect(json.interactive.header.text).toBeUndefined();
    });

    it('should handle empty text header', () => {
      const message = new TestInteractionMessage({ type: 'list' });

      message.setHeader('text', '');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.header.type).toBe('text');
      expect(json.interactive.header.text).toBe('');
    });
  });

  describe('method chaining', () => {
    it('should support full method chaining', () => {
      const message = new TestInteractionMessage({ type: 'button' })
        .setText('Main content')
        .setHeader('text', 'Header content')
        .setFooter('Footer content');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.header.text).toBe('Header content');
      expect(json.interactive.body.text).toBe('Main content');
      expect(json.interactive.footer.text).toBe('Footer content');
    });

    it('should allow setting properties in any order', () => {
      const message = new TestInteractionMessage({ type: 'list' })
        .setFooter('Footer first')
        .setHeader('image', 'https://example.com/image.jpg')
        .setText('Text last');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.header.type).toBe('image');
      expect(json.interactive.header.image.link).toBe('https://example.com/image.jpg');
      expect(json.interactive.body.text).toBe('Text last');
      expect(json.interactive.footer.text).toBe('Footer first');
    });
  });

  describe('toJSON', () => {
    it('should serialize to the expected payload for minimal interaction message', () => {
      const message = new TestInteractionMessage({ type: 'button' });

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toEqual({
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: undefined,
          },
        },
      });
    });

    it('should serialize to the expected payload for complete interaction message', () => {
      const message = new TestInteractionMessage({
        type: 'list',
        text: 'Choose an option',
      })
        .setHeader('text', 'Selection Menu')
        .setFooter('Make your choice');

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toEqual({
        type: 'interactive',
        interactive: {
          type: 'list',
          header: {
            type: 'text',
            text: 'Selection Menu',
          },
          body: {
            text: 'Choose an option',
          },
          footer: {
            text: 'Make your choice',
          },
        },
      });
    });

    it('should handle interaction message with media header', () => {
      const message = new TestInteractionMessage({ type: 'button' })
        .setText('Button message')
        .setHeader('video', 'https://example.com/demo.mp4')
        .setFooter('Video demo above');

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed.interactive.header).toEqual({
        type: 'video',
        video: {
          link: 'https://example.com/demo.mp4',
        },
      });
      expect(parsed.interactive.body.text).toBe('Button message');
      expect(parsed.interactive.footer.text).toBe('Video demo above');
    });
  });
});
