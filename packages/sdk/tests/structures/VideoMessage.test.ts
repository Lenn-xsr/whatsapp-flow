import { VideoMessage } from '../../src/structures/VideoMessage';
import { ValidationError } from '../../src/errors';

describe('VideoMessage', () => {
  describe('constructor', () => {
    it('should create a video message with default type', () => {
      const message = new VideoMessage();

      expect(message.type).toBe('video');
      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'video',
        video: {},
      });
    });

    it('should create a video message with initial options', () => {
      const message = new VideoMessage({
        link: 'https://example.com/video.mp4',
        caption: 'Test video',
      });

      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'video',
        video: {
          link: 'https://example.com/video.mp4',
          caption: 'Test video',
        },
      });
    });
  });

  describe('setLink', () => {
    it('should set a valid video URL', () => {
      const message = new VideoMessage();
      const result = message.setLink('https://example.com/video.mp4');

      expect(result).toBe(message); // Should return this for chaining
      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'video',
        video: {
          link: 'https://example.com/video.mp4',
        },
      });
    });

    it('should accept different video formats', () => {
      const message = new VideoMessage();

      message.setLink('https://example.com/video.avi');
      expect(JSON.parse(JSON.stringify(message)).video.link).toBe('https://example.com/video.avi');

      message.setLink('https://example.com/video.mov');
      expect(JSON.parse(JSON.stringify(message)).video.link).toBe('https://example.com/video.mov');
    });

    it('should throw ValidationError for invalid URL', () => {
      const message = new VideoMessage();

      expect(() => message.setLink('invalid-url')).toThrow(ValidationError);
      expect(() => message.setLink('')).toThrow(ValidationError);
    });

    it('should throw ValidationError for null/undefined link', () => {
      const message = new VideoMessage();

      expect(() => message.setLink(null as unknown as string)).toThrow(ValidationError);
      expect(() => message.setLink(undefined as unknown as string)).toThrow(ValidationError);
    });
  });

  describe('setCaption', () => {
    it('should set a valid caption', () => {
      const message = new VideoMessage();
      const result = message.setCaption('Amazing video!');

      expect(result).toBe(message); // Should return this for chaining
      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'video',
        video: {
          caption: 'Amazing video!',
        },
      });
    });

    it('should handle emojis and special characters', () => {
      const message = new VideoMessage();
      message.setCaption('🎥 Check this out! 😍');

      expect(JSON.parse(JSON.stringify(message)).video.caption).toBe('🎥 Check this out! 😍');
    });

    it('should throw ValidationError for empty caption', () => {
      const message = new VideoMessage();

      expect(() => message.setCaption('')).toThrow(ValidationError);
      expect(() => message.setCaption('   ')).toThrow(ValidationError);
    });

    it('should throw ValidationError for null/undefined caption', () => {
      const message = new VideoMessage();

      expect(() => message.setCaption(null as unknown as string)).toThrow(ValidationError);
      expect(() => message.setCaption(undefined as unknown as string)).toThrow(ValidationError);
    });
  });

  describe('method chaining', () => {
    it('should support method chaining', () => {
      const message = new VideoMessage()
        .setLink('https://example.com/video.mp4')
        .setCaption('Awesome video content');

      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'video',
        video: {
          link: 'https://example.com/video.mp4',
          caption: 'Awesome video content',
        },
      });
    });

    it('should allow setting properties in any order', () => {
      const message = new VideoMessage()
        .setCaption('Caption first')
        .setLink('https://example.com/video.mp4');

      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'video',
        video: {
          link: 'https://example.com/video.mp4',
          caption: 'Caption first',
        },
      });
    });
  });

  describe('toJSON', () => {
    it('should return correct JSON structure with all properties', () => {
      const message = new VideoMessage({
        link: 'https://example.com/test.mp4',
        caption: 'Test caption',
      });

      const jsonString = JSON.stringify(message);
      const json = JSON.parse(jsonString);

      expect(json).toEqual({
        type: 'video',
        video: {
          link: 'https://example.com/test.mp4',
          caption: 'Test caption',
        },
      });
    });

    it('should handle video with only link', () => {
      const message = new VideoMessage().setLink('https://example.com/video.mp4');

      const jsonString = JSON.stringify(message);
      const json = JSON.parse(jsonString);

      expect(json).toEqual({
        type: 'video',
        video: {
          link: 'https://example.com/video.mp4',
        },
      });
    });

    it('should handle empty video message', () => {
      const message = new VideoMessage();

      const jsonString = JSON.stringify(message);
      const json = JSON.parse(jsonString);

      expect(json).toEqual({
        type: 'video',
        video: {},
      });
    });
  });
});
