import { ImageMessage } from '../../src/structures/ImageMessage';
import { ValidationError } from '../../src/errors';

describe('ImageMessage', () => {
  describe('constructor', () => {
    it('should create an image message with options', () => {
      const message = new ImageMessage({
        link: 'https://example.com/image.jpg',
        caption: 'Test image',
      });

      expect(message.props.link).toBe('https://example.com/image.jpg');
      expect(message.props.caption).toBe('Test image');
    });

    it('should create an image message without options', () => {
      const message = new ImageMessage();
      expect(message.props.link).toBeUndefined();
      expect(message.props.caption).toBeUndefined();
    });
  });

  describe('setLink', () => {
    it('should set a valid image link', () => {
      const message = new ImageMessage();
      const result = message.setLink('https://example.com/image.jpg');

      expect(message.props.link).toBe('https://example.com/image.jpg');
      expect(result).toBe(message);
    });

    it('should throw ValidationError for invalid URL', () => {
      const message = new ImageMessage();

      expect(() => message.setLink('not-a-url')).toThrow(ValidationError);
      expect(() => message.setLink('')).toThrow(ValidationError);
      expect(() => message.setLink('ftp://invalid')).toThrow(ValidationError);
    });

    it('should accept various valid URL formats', () => {
      const message = new ImageMessage();

      expect(() => message.setLink('https://example.com/image.jpg')).not.toThrow();
      expect(() => message.setLink('http://example.com/image.png')).not.toThrow();
      expect(() => message.setLink('https://subdomain.example.com/image.gif')).not.toThrow();
    });
  });

  describe('setCaption', () => {
    it('should set a valid caption', () => {
      const message = new ImageMessage();
      const result = message.setCaption('Test caption');

      expect(message.props.caption).toBe('Test caption');
      expect(result).toBe(message);
    });

    it('should throw ValidationError for empty caption', () => {
      const message = new ImageMessage();

      expect(() => message.setCaption('')).toThrow(ValidationError);
      expect(() => message.setCaption('   ')).toThrow(ValidationError);
    });
  });

  describe('toJSON', () => {
    it('should return correct JSON structure', () => {
      const message = new ImageMessage({
        link: 'https://example.com/image.jpg',
        caption: 'Test image',
      });

      expect(message.toJSON()).toEqual({
        type: 'image',
        image: { link: 'https://example.com/image.jpg', caption: 'Test image' },
      });
    });
  });
});
