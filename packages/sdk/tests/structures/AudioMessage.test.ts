import { AudioMessage } from '../../src/structures/AudioMessage';
import { ValidationError } from '../../src/errors';

describe('AudioMessage', () => {
  describe('constructor', () => {
    it('should create an audio message with default type', () => {
      const message = new AudioMessage();

      expect(message.type).toBe('audio');
      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'audio',
        audio: {},
      });
    });

    it('should create an audio message with initial options', () => {
      const message = new AudioMessage({
        link: 'https://example.com/audio.mp3',
      });

      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'audio',
        audio: {
          link: 'https://example.com/audio.mp3',
        },
      });
    });
  });

  describe('setLink', () => {
    it('should set a valid audio URL', () => {
      const message = new AudioMessage();
      const result = message.setLink('https://example.com/audio.mp3');

      expect(result).toBe(message); // Should return this for chaining
      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'audio',
        audio: {
          link: 'https://example.com/audio.mp3',
        },
      });
    });

    it('should accept different audio formats', () => {
      const message = new AudioMessage();

      message.setLink('https://example.com/audio.wav');
      expect(JSON.parse(JSON.stringify(message)).audio.link).toBe('https://example.com/audio.wav');

      message.setLink('https://example.com/audio.ogg');
      expect(JSON.parse(JSON.stringify(message)).audio.link).toBe('https://example.com/audio.ogg');
    });

    it('should throw ValidationError for invalid URL', () => {
      const message = new AudioMessage();

      expect(() => message.setLink('invalid-url')).toThrow(ValidationError);
      expect(() => message.setLink('')).toThrow(ValidationError);
    });

    it('should throw ValidationError for null/undefined link', () => {
      const message = new AudioMessage();

      expect(() => message.setLink(null as unknown as string)).toThrow(ValidationError);
      expect(() => message.setLink(undefined as unknown as string)).toThrow(ValidationError);
    });
  });

  describe('method chaining', () => {
    it('should support method chaining', () => {
      const message = new AudioMessage().setLink('https://example.com/audio.mp3');

      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'audio',
        audio: {
          link: 'https://example.com/audio.mp3',
        },
      });
    });
  });

  describe('toJSON', () => {
    it('should return correct JSON structure', () => {
      const message = new AudioMessage({
        link: 'https://example.com/test.mp3',
      });

      const jsonString = JSON.stringify(message);
      const json = JSON.parse(jsonString);

      expect(json).toEqual({
        type: 'audio',
        audio: {
          link: 'https://example.com/test.mp3',
        },
      });
    });

    it('should handle empty audio message', () => {
      const message = new AudioMessage();

      const jsonString = JSON.stringify(message);
      const json = JSON.parse(jsonString);

      expect(json).toEqual({
        type: 'audio',
        audio: {},
      });
    });
  });
});
