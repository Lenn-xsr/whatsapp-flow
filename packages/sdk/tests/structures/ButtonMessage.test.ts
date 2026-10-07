import { ButtonMessage, Button } from '../../src/structures/ButtonMessage';

describe('ButtonMessage', () => {
  describe('Button class', () => {
    it('should create a button with title and id', () => {
      const button = new Button('Click Me', 'btn_1');

      expect(button.title).toBe('Click Me');
      expect(button.id).toBe('btn_1');
    });

    it('should return correct JSON structure', () => {
      const button = new Button('Test Button', 'test_btn');

      expect(button.toJSON()).toEqual({
        type: 'reply',
        reply: {
          title: 'Test Button',
          id: 'test_btn',
        },
      });
    });
  });

  describe('constructor', () => {
    it('should create a button message with default type', () => {
      const message = new ButtonMessage();

      expect(message.type).toBe('interactive');
      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.type).toBe('button');
    });

    it('should create a button message with text', () => {
      const message = new ButtonMessage({
        text: 'Choose an option',
        button: [],
      });

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.body.text).toBe('Choose an option');
    });

    it('should create a button message with buttons', () => {
      const buttons = [new Button('Option 1', 'opt_1'), new Button('Option 2', 'opt_2')];

      const message = new ButtonMessage({
        text: 'Choose an option',
        button: buttons,
      });

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.action.buttons).toHaveLength(2);
      expect(json.interactive.action.buttons[0].reply.title).toBe('Option 1');
      expect(json.interactive.action.buttons[1].reply.title).toBe('Option 2');
    });
  });

  describe('setButtons', () => {
    it('should set buttons using Button objects', () => {
      const message = new ButtonMessage();
      const buttons = [new Button('Yes', 'yes'), new Button('No', 'no')];

      const result = message.setButtons(buttons);

      expect(result).toBe(message); // Should return this for chaining

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.action.buttons).toHaveLength(2);
      expect(json.interactive.action.buttons[0].reply.title).toBe('Yes');
      expect(json.interactive.action.buttons[0].reply.id).toBe('yes');
      expect(json.interactive.action.buttons[1].reply.title).toBe('No');
      expect(json.interactive.action.buttons[1].reply.id).toBe('no');
    });

    it('should set buttons using plain objects', () => {
      const message = new ButtonMessage();
      const buttons = [
        { title: 'Accept', id: 'accept' },
        { title: 'Decline', id: 'decline' },
      ];

      message.setButtons(buttons);

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.action.buttons).toHaveLength(2);
      expect(json.interactive.action.buttons[0].reply.title).toBe('Accept');
      expect(json.interactive.action.buttons[0].reply.id).toBe('accept');
      expect(json.interactive.action.buttons[1].reply.title).toBe('Decline');
      expect(json.interactive.action.buttons[1].reply.id).toBe('decline');
    });

    it('should handle mixed Button objects and plain objects', () => {
      const message = new ButtonMessage();
      const buttons = [
        new Button('Button Object', 'btn_obj'),
        { title: 'Plain Object', id: 'plain_obj' },
      ];

      message.setButtons(buttons);

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.action.buttons).toHaveLength(2);
      expect(json.interactive.action.buttons[0].reply.title).toBe('Button Object');
      expect(json.interactive.action.buttons[1].reply.title).toBe('Plain Object');
    });

    it('should handle empty buttons array', () => {
      const message = new ButtonMessage();

      message.setButtons([]);

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.action.buttons).toHaveLength(0);
    });
  });

  describe('method chaining', () => {
    it('should support method chaining', () => {
      const message = new ButtonMessage()
        .setText('Please choose:')
        .setButtons([
          { title: 'Option A', id: 'a' },
          { title: 'Option B', id: 'b' },
        ])
        .setFooter('Choose wisely');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.body.text).toBe('Please choose:');
      expect(json.interactive.footer.text).toBe('Choose wisely');
      expect(json.interactive.action.buttons).toHaveLength(2);
    });
  });

  describe('inherited methods from InteractionMessage', () => {
    it('should support setText method', () => {
      const message = new ButtonMessage();

      message.setText('Updated text');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.body.text).toBe('Updated text');
    });

    it('should support setFooter method', () => {
      const message = new ButtonMessage();

      message.setFooter('Footer text');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.footer.text).toBe('Footer text');
    });

    it('should support setHeader with text', () => {
      const message = new ButtonMessage();

      message.setHeader('text', 'Header text');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.header.type).toBe('text');
      expect(json.interactive.header.text).toBe('Header text');
    });

    it('should support setHeader with media', () => {
      const message = new ButtonMessage();

      message.setHeader('image', 'https://example.com/image.jpg');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.interactive.header.type).toBe('image');
      expect(json.interactive.header.image.link).toBe('https://example.com/image.jpg');
    });
  });

  describe('toJSON', () => {
    it('should serialize to the expected payload', () => {
      const message = new ButtonMessage({
        text: 'Test message',
        button: [{ title: 'Test Button', id: 'test' }],
      });

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toEqual({
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: 'Test message',
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  title: 'Test Button',
                  id: 'test',
                },
              },
            ],
          },
        },
      });
    });

    it('should handle complete button message with all properties', () => {
      const message = new ButtonMessage({
        text: 'Main text',
        button: [
          { title: 'Button 1', id: 'btn1' },
          { title: 'Button 2', id: 'btn2' },
        ],
      })
        .setHeader('text', 'Header text')
        .setFooter('Footer text');

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed.interactive.header.text).toBe('Header text');
      expect(parsed.interactive.body.text).toBe('Main text');
      expect(parsed.interactive.footer.text).toBe('Footer text');
      expect(parsed.interactive.action.buttons).toHaveLength(2);
    });
  });
});
