import { AttachmentType } from '../../src/structures/Attachment';

describe('Attachment', () => {
  describe('AttachmentType', () => {
    it('should export correct attachment types', () => {
      // Test that the type exists and has expected values
      const audioType: AttachmentType = 'audio';
      const imageType: AttachmentType = 'image';
      const videoType: AttachmentType = 'video';
      const documentType: AttachmentType = 'document';

      expect(audioType).toBe('audio');
      expect(imageType).toBe('image');
      expect(videoType).toBe('video');
      expect(documentType).toBe('document');
    });

    it('should only allow valid attachment types', () => {
      // TypeScript compilation test - these should be valid
      const validTypes: AttachmentType[] = ['audio', 'image', 'video', 'document'];

      validTypes.forEach((type) => {
        expect(['audio', 'image', 'video', 'document']).toContain(type);
      });
    });

    it('should be usable in type annotations', () => {
      // Test that the type can be used in function parameters
      function processAttachment(type: AttachmentType, url: string): string {
        return `Processing ${type} from ${url}`;
      }

      expect(processAttachment('audio', 'https://example.com/audio.mp3')).toBe(
        'Processing audio from https://example.com/audio.mp3',
      );

      expect(processAttachment('image', 'https://example.com/image.jpg')).toBe(
        'Processing image from https://example.com/image.jpg',
      );

      expect(processAttachment('video', 'https://example.com/video.mp4')).toBe(
        'Processing video from https://example.com/video.mp4',
      );

      expect(processAttachment('document', 'https://example.com/doc.pdf')).toBe(
        'Processing document from https://example.com/doc.pdf',
      );
    });

    it('should be usable in object properties', () => {
      interface MediaFile {
        type: AttachmentType;
        url: string;
        size?: number;
      }

      const audioFile: MediaFile = {
        type: 'audio',
        url: 'https://example.com/song.mp3',
        size: 1024000,
      };

      const imageFile: MediaFile = {
        type: 'image',
        url: 'https://example.com/photo.jpg',
      };

      expect(audioFile.type).toBe('audio');
      expect(audioFile.url).toBe('https://example.com/song.mp3');
      expect(audioFile.size).toBe(1024000);

      expect(imageFile.type).toBe('image');
      expect(imageFile.url).toBe('https://example.com/photo.jpg');
      expect(imageFile.size).toBeUndefined();
    });

    it('should work with arrays and collections', () => {
      const attachmentTypes: AttachmentType[] = ['audio', 'image', 'video', 'document'];

      expect(attachmentTypes).toHaveLength(4);
      expect(attachmentTypes).toContain('audio');
      expect(attachmentTypes).toContain('image');
      expect(attachmentTypes).toContain('video');
      expect(attachmentTypes).toContain('document');
    });

    it('should work with Set and Map collections', () => {
      const typeSet = new Set<AttachmentType>(['audio', 'image', 'video', 'document']);

      expect(typeSet.size).toBe(4);
      expect(typeSet.has('audio')).toBe(true);
      expect(typeSet.has('image')).toBe(true);
      expect(typeSet.has('video')).toBe(true);
      expect(typeSet.has('document')).toBe(true);

      const typeMap = new Map<AttachmentType, string>([
        ['audio', 'Audio files'],
        ['image', 'Image files'],
        ['video', 'Video files'],
        ['document', 'Document files'],
      ]);

      expect(typeMap.size).toBe(4);
      expect(typeMap.get('audio')).toBe('Audio files');
      expect(typeMap.get('image')).toBe('Image files');
      expect(typeMap.get('video')).toBe('Video files');
      expect(typeMap.get('document')).toBe('Document files');
    });

    it('should work with conditional logic', () => {
      function getFileExtension(type: AttachmentType): string[] {
        switch (type) {
          case 'audio':
            return ['.mp3', '.wav', '.ogg'];
          case 'image':
            return ['.jpg', '.jpeg', '.png', '.gif'];
          case 'video':
            return ['.mp4', '.avi', '.mov', '.wmv'];
          case 'document':
            return ['.pdf', '.doc', '.docx', '.txt'];
          default:
            return [];
        }
      }

      expect(getFileExtension('audio')).toEqual(['.mp3', '.wav', '.ogg']);
      expect(getFileExtension('image')).toEqual(['.jpg', '.jpeg', '.png', '.gif']);
      expect(getFileExtension('video')).toEqual(['.mp4', '.avi', '.mov', '.wmv']);
      expect(getFileExtension('document')).toEqual(['.pdf', '.doc', '.docx', '.txt']);
    });

    it('should work with filtering operations', () => {
      interface Attachment {
        id: string;
        type: AttachmentType;
        name: string;
      }

      const attachments: Attachment[] = [
        { id: '1', type: 'audio', name: 'song.mp3' },
        { id: '2', type: 'image', name: 'photo.jpg' },
        { id: '3', type: 'video', name: 'clip.mp4' },
        { id: '4', type: 'document', name: 'report.pdf' },
        { id: '5', type: 'image', name: 'avatar.png' },
      ];

      const imageAttachments = attachments.filter((att) => att.type === 'image');
      const mediaAttachments = attachments.filter(
        (att) => att.type === 'audio' || att.type === 'video' || att.type === 'image',
      );

      expect(imageAttachments).toHaveLength(2);
      expect(imageAttachments[0]?.name).toBe('photo.jpg');
      expect(imageAttachments[1]?.name).toBe('avatar.png');

      expect(mediaAttachments).toHaveLength(4);
      expect(mediaAttachments.some((att) => att.type === 'document')).toBe(false);
    });
  });
});
