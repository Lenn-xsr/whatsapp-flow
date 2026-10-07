import {
  TemplateMessage,
  TemplateParameterText,
  TemplateParameterMedia,
  TemplateMessageComponent,
  TemplateMessageComponentButton,
} from '../../src/structures/TemplateMessage';

describe('TemplateMessage', () => {
  describe('TemplateParameterText class', () => {
    it('should create a text parameter', () => {
      const param = new TemplateParameterText('Hello World');

      expect(param.text).toBe('Hello World');
    });

    it('should return correct JSON structure', () => {
      const param = new TemplateParameterText('Test text');

      expect(param.toJSON()).toEqual({
        type: 'text',
        text: 'Test text',
      });
    });
  });

  describe('TemplateParameterMedia class', () => {
    it('should create a media parameter with image', () => {
      const param = new TemplateParameterMedia('image', 'https://example.com/image.jpg');

      expect(param.type).toBe('image');
      expect(param.url).toBe('https://example.com/image.jpg');
    });

    it('should create a media parameter with video', () => {
      const param = new TemplateParameterMedia('video', 'https://example.com/video.mp4');

      expect(param.type).toBe('video');
      expect(param.url).toBe('https://example.com/video.mp4');
    });

    it('should create a media parameter with document', () => {
      const param = new TemplateParameterMedia('document', 'https://example.com/doc.pdf');

      expect(param.type).toBe('document');
      expect(param.url).toBe('https://example.com/doc.pdf');
    });

    it('should return correct JSON structure for image', () => {
      const param = new TemplateParameterMedia('image', 'https://example.com/test.jpg');

      expect(param.toJSON()).toEqual({
        type: 'image',
        image: {
          link: 'https://example.com/test.jpg',
        },
      });
    });

    it('should return correct JSON structure for video', () => {
      const param = new TemplateParameterMedia('video', 'https://example.com/test.mp4');

      expect(param.toJSON()).toEqual({
        type: 'video',
        video: {
          link: 'https://example.com/test.mp4',
        },
      });
    });

    it('should return correct JSON structure for document', () => {
      const param = new TemplateParameterMedia('document', 'https://example.com/test.pdf');

      expect(param.toJSON()).toEqual({
        type: 'document',
        document: {
          link: 'https://example.com/test.pdf',
        },
      });
    });
  });

  describe('TemplateMessageComponent class', () => {
    it('should create a component with type and parameters', () => {
      const textParam = new TemplateParameterText('Hello');
      const component = new TemplateMessageComponent('body', [textParam]);

      expect(component.type).toBe('body');
      expect(component.parameters).toHaveLength(1);
      expect(component.parameters[0]).toBe(textParam);
    });

    it('should return correct JSON structure', () => {
      const textParam = new TemplateParameterText('Test parameter');
      const mediaParam = new TemplateParameterMedia('image', 'https://example.com/image.jpg');
      const component = new TemplateMessageComponent('body', [textParam, mediaParam]);

      expect(component.toJSON()).toEqual({
        type: 'body',
        parameters: [
          {
            type: 'text',
            text: 'Test parameter',
          },
          {
            type: 'image',
            image: {
              link: 'https://example.com/image.jpg',
            },
          },
        ],
      });
    });

    it('should handle empty parameters', () => {
      const component = new TemplateMessageComponent('header', []);

      expect(component.toJSON()).toEqual({
        type: 'header',
        parameters: [],
      });
    });
  });

  describe('TemplateMessageComponentButton class', () => {
    it('should create a button component', () => {
      const textParam = new TemplateParameterText('Button text');
      const button = new TemplateMessageComponentButton([textParam], 'quick_reply', '0');

      expect(button.type).toBe('button');
      expect(button.subType).toBe('quick_reply');
      expect(button.index).toBe('0');
      expect(button.parameters).toHaveLength(1);
    });

    it('should return correct JSON structure', () => {
      const textParam = new TemplateParameterText('Click me');
      const button = new TemplateMessageComponentButton([textParam], 'url', '1');

      expect(button.toJSON()).toEqual({
        type: 'button',
        sub_type: 'url',
        index: '1',
        parameters: [{ type: 'text', text: 'Click me' }],
      });
    });
  });

  describe('language', () => {
    it('uses the language given in the options', () => {
      const message = new TemplateMessage({ name: 'welcome', language: 'pt_BR' });

      expect(message.toJSON()).toEqual({
        type: 'template',
        template: { name: 'welcome', language: { code: 'pt_BR' } },
      });
    });

    it('allows changing the language after construction', () => {
      const message = new TemplateMessage({ name: 'welcome' }).setLanguage('es');

      expect(JSON.parse(JSON.stringify(message)).template.language).toEqual({ code: 'es' });
    });
  });

  describe('constructor', () => {
    it('should create a template message with minimal options', () => {
      const message = new TemplateMessage();

      expect(message.type).toBe('template');
      const json = JSON.parse(JSON.stringify(message));
      expect(json.template.language.code).toBe('en_US');
    });

    it('should create a template message with name', () => {
      const message = new TemplateMessage({
        name: 'hello_world',
      });

      const json = JSON.parse(JSON.stringify(message));
      expect(json.template.name).toBe('hello_world');
      expect(json.template.language.code).toBe('en_US');
    });

    it('should create a template message with components', () => {
      const textParam = new TemplateParameterText('John');
      const component = new TemplateMessageComponent('body', [textParam]);

      const message = new TemplateMessage({
        name: 'greeting_template',
        components: [component],
      });

      const json = JSON.parse(JSON.stringify(message));
      expect(json.template.name).toBe('greeting_template');
      expect(json.template.components).toHaveLength(1);
      expect(json.template.components[0].type).toBe('body');
    });

    it('should handle undefined options', () => {
      const message = new TemplateMessage(undefined);

      expect(message.type).toBe('template');
      const json = JSON.parse(JSON.stringify(message));
      expect(json.template.language.code).toBe('en_US');
      expect(json.template.name).toBeUndefined();
    });
  });

  describe('setName', () => {
    it('should set template name', () => {
      const message = new TemplateMessage();
      const result = message.setName('welcome_message');

      expect(result).toBe(message); // Should return this for chaining

      const json = JSON.parse(JSON.stringify(message));
      expect(json.template.name).toBe('welcome_message');
    });

    it('should update existing name', () => {
      const message = new TemplateMessage({ name: 'old_name' });

      message.setName('new_name');

      const json = JSON.parse(JSON.stringify(message));
      expect(json.template.name).toBe('new_name');
    });
  });

  describe('setComponents', () => {
    it('should set template components', () => {
      const message = new TemplateMessage();
      const textParam = new TemplateParameterText('User Name');
      const component = new TemplateMessageComponent('body', [textParam]);

      const result = message.setComponents([component]);

      expect(result).toBe(message); // Should return this for chaining

      const json = JSON.parse(JSON.stringify(message));
      expect(json.template.components).toHaveLength(1);
      expect(json.template.components[0]).toEqual({
        type: 'body',
        parameters: [
          {
            type: 'text',
            text: 'User Name',
          },
        ],
      });
    });

    it('should handle multiple components', () => {
      const message = new TemplateMessage();

      const headerParam = new TemplateParameterMedia('image', 'https://example.com/header.jpg');
      const headerComponent = new TemplateMessageComponent('header', [headerParam]);

      const bodyParam = new TemplateParameterText('Welcome back!');
      const bodyComponent = new TemplateMessageComponent('body', [bodyParam]);

      const buttonParam = new TemplateParameterText('Continue');
      const buttonComponent = new TemplateMessageComponentButton([buttonParam], 'quick_reply', '0');

      message.setComponents([headerComponent, bodyComponent, buttonComponent]);

      const json = JSON.parse(JSON.stringify(message));
      expect(json.template.components).toHaveLength(3);
      expect(json.template.components[0].type).toBe('header');
      expect(json.template.components[1].type).toBe('body');
      expect(json.template.components[2].type).toBe('button');
    });

    it('should handle empty components array', () => {
      const message = new TemplateMessage();

      message.setComponents([]);

      const json = JSON.parse(JSON.stringify(message));
      expect(json.template.components).toEqual([]);
    });

    it('should replace existing components', () => {
      const oldParam = new TemplateParameterText('Old text');
      const oldComponent = new TemplateMessageComponent('body', [oldParam]);

      const message = new TemplateMessage({
        name: 'test_template',
        components: [oldComponent],
      });

      const newParam = new TemplateParameterText('New text');
      const newComponent = new TemplateMessageComponent('header', [newParam]);

      message.setComponents([newComponent]);

      const json = JSON.parse(JSON.stringify(message));
      expect(json.template.components).toHaveLength(1);
      expect(json.template.components[0].type).toBe('header');
      expect(json.template.components[0].parameters[0].text).toBe('New text');
    });
  });

  describe('method chaining', () => {
    it('should support method chaining', () => {
      const textParam = new TemplateParameterText('John Doe');
      const component = new TemplateMessageComponent('body', [textParam]);

      const message = new TemplateMessage().setName('user_greeting').setComponents([component]);

      const json = JSON.parse(JSON.stringify(message));
      expect(json.template.name).toBe('user_greeting');
      expect(json.template.components).toHaveLength(1);
      expect(json.template.components[0].parameters[0].text).toBe('John Doe');
    });
  });

  describe('toJSON', () => {
    it('should serialize to the expected payload for minimal template', () => {
      const message = new TemplateMessage({ name: 'simple_template' });

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toEqual({
        type: 'template',
        template: {
          name: 'simple_template',
          language: {
            code: 'en_US',
          },
        },
      });
    });

    it('should serialize to the expected payload for complex template', () => {
      const headerParam = new TemplateParameterMedia('image', 'https://example.com/header.jpg');
      const headerComponent = new TemplateMessageComponent('header', [headerParam]);

      const bodyParam1 = new TemplateParameterText('Welcome');
      const bodyParam2 = new TemplateParameterText('John');
      const bodyComponent = new TemplateMessageComponent('body', [bodyParam1, bodyParam2]);

      const buttonParam = new TemplateParameterText('Get Started');
      const buttonComponent = new TemplateMessageComponentButton([buttonParam], 'quick_reply', '0');

      const message = new TemplateMessage({
        name: 'welcome_template',
        components: [headerComponent, bodyComponent, buttonComponent],
      });

      const jsonString = JSON.stringify(message);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toEqual({
        type: 'template',
        template: {
          name: 'welcome_template',
          language: {
            code: 'en_US',
          },
          components: [
            {
              type: 'header',
              parameters: [
                {
                  type: 'image',
                  image: {
                    link: 'https://example.com/header.jpg',
                  },
                },
              ],
            },
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: 'Welcome',
                },
                {
                  type: 'text',
                  text: 'John',
                },
              ],
            },
            {
              type: 'button',
              sub_type: 'quick_reply',
              index: '0',
              parameters: [
                {
                  type: 'text',
                  text: 'Get Started',
                },
              ],
            },
          ],
        },
      });
    });
  });
});
