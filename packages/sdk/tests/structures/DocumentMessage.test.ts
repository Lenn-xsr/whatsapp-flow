import { DocumentMessage } from '../../src/structures/DocumentMessage';
import { ValidationError } from '../../src/errors';

describe('DocumentMessage', () => {
  describe('constructor', () => {
    it('should create a document message with default type', () => {
      const message = new DocumentMessage();

      expect(message.type).toBe('document');
      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'document',
        document: {},
      });
    });

    it('should create a document message with initial options', () => {
      const message = new DocumentMessage({
        link: 'https://example.com/document.pdf',
        caption: 'Important document',
        filename: 'report.pdf',
      });

      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'document',
        document: {
          link: 'https://example.com/document.pdf',
          caption: 'Important document',
          filename: 'report.pdf',
        },
      });
    });
  });

  describe('setLink', () => {
    it('should set a valid document URL', () => {
      const message = new DocumentMessage();
      const result = message.setLink('https://example.com/document.pdf');

      expect(result).toBe(message); // Should return this for chaining
      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'document',
        document: {
          link: 'https://example.com/document.pdf',
        },
      });
    });

    it('should accept different document formats', () => {
      const message = new DocumentMessage();

      message.setLink('https://example.com/document.docx');
      expect(JSON.parse(JSON.stringify(message)).document.link).toBe(
        'https://example.com/document.docx',
      );

      message.setLink('https://example.com/spreadsheet.xlsx');
      expect(JSON.parse(JSON.stringify(message)).document.link).toBe(
        'https://example.com/spreadsheet.xlsx',
      );

      message.setLink('https://example.com/presentation.pptx');
      expect(JSON.parse(JSON.stringify(message)).document.link).toBe(
        'https://example.com/presentation.pptx',
      );
    });

    it('should throw ValidationError for invalid URL', () => {
      const message = new DocumentMessage();

      expect(() => message.setLink('invalid-url')).toThrow(ValidationError);
      expect(() => message.setLink('')).toThrow(ValidationError);
    });

    it('should throw ValidationError for null/undefined link', () => {
      const message = new DocumentMessage();

      expect(() => message.setLink(null as unknown as string)).toThrow(ValidationError);
      expect(() => message.setLink(undefined as unknown as string)).toThrow(ValidationError);
    });
  });

  describe('setCaption', () => {
    it('should set a valid caption', () => {
      const message = new DocumentMessage();
      const result = message.setCaption('Important document');

      expect(result).toBe(message); // Should return this for chaining
      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'document',
        document: {
          caption: 'Important document',
        },
      });
    });

    it('should handle emojis and special characters', () => {
      const message = new DocumentMessage();
      message.setCaption('📄 Please review this document 📋');

      expect(JSON.parse(JSON.stringify(message)).document.caption).toBe(
        '📄 Please review this document 📋',
      );
    });

    it('should throw ValidationError for empty caption', () => {
      const message = new DocumentMessage();

      expect(() => message.setCaption('')).toThrow(ValidationError);
      expect(() => message.setCaption('   ')).toThrow(ValidationError);
    });

    it('should throw ValidationError for null/undefined caption', () => {
      const message = new DocumentMessage();

      expect(() => message.setCaption(null as unknown as string)).toThrow(ValidationError);
      expect(() => message.setCaption(undefined as unknown as string)).toThrow(ValidationError);
    });
  });

  describe('setFilename', () => {
    it('should set a valid filename', () => {
      const message = new DocumentMessage();
      const result = message.setFilename('report.pdf');

      expect(result).toBe(message); // Should return this for chaining
      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'document',
        document: {
          filename: 'report.pdf',
        },
      });
    });

    it('should handle different filename formats', () => {
      const message = new DocumentMessage();

      message.setFilename('document with spaces.pdf');
      expect(JSON.parse(JSON.stringify(message)).document.filename).toBe(
        'document with spaces.pdf',
      );

      message.setFilename('file_with_underscores.docx');
      expect(JSON.parse(JSON.stringify(message)).document.filename).toBe(
        'file_with_underscores.docx',
      );

      message.setFilename('file-with-dashes.xlsx');
      expect(JSON.parse(JSON.stringify(message)).document.filename).toBe('file-with-dashes.xlsx');
    });

    it('should throw ValidationError for empty filename', () => {
      const message = new DocumentMessage();

      expect(() => message.setFilename('')).toThrow(ValidationError);
      expect(() => message.setFilename('   ')).toThrow(ValidationError);
    });

    it('should throw ValidationError for null/undefined filename', () => {
      const message = new DocumentMessage();

      expect(() => message.setFilename(null as unknown as string)).toThrow(ValidationError);
      expect(() => message.setFilename(undefined as unknown as string)).toThrow(ValidationError);
    });
  });

  describe('method chaining', () => {
    it('should support method chaining with all properties', () => {
      const message = new DocumentMessage()
        .setLink('https://example.com/report.pdf')
        .setCaption('Monthly report')
        .setFilename('monthly_report_2024.pdf');

      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'document',
        document: {
          link: 'https://example.com/report.pdf',
          caption: 'Monthly report',
          filename: 'monthly_report_2024.pdf',
        },
      });
    });

    it('should allow setting properties in any order', () => {
      const message = new DocumentMessage()
        .setFilename('filename_first.pdf')
        .setCaption('Caption second')
        .setLink('https://example.com/document.pdf');

      const json = JSON.parse(JSON.stringify(message));
      expect(json).toEqual({
        type: 'document',
        document: {
          link: 'https://example.com/document.pdf',
          caption: 'Caption second',
          filename: 'filename_first.pdf',
        },
      });
    });
  });

  describe('toJSON', () => {
    it('should return correct JSON structure with all properties', () => {
      const message = new DocumentMessage({
        link: 'https://example.com/test.pdf',
        caption: 'Test document',
        filename: 'test.pdf',
      });

      const jsonString = JSON.stringify(message);
      const json = JSON.parse(jsonString);

      expect(json).toEqual({
        type: 'document',
        document: {
          link: 'https://example.com/test.pdf',
          caption: 'Test document',
          filename: 'test.pdf',
        },
      });
    });

    it('should handle document with only link', () => {
      const message = new DocumentMessage().setLink('https://example.com/document.pdf');

      const jsonString = JSON.stringify(message);
      const json = JSON.parse(jsonString);

      expect(json).toEqual({
        type: 'document',
        document: {
          link: 'https://example.com/document.pdf',
        },
      });
    });

    it('should handle document with link and filename only', () => {
      const message = new DocumentMessage()
        .setLink('https://example.com/document.pdf')
        .setFilename('important.pdf');

      const jsonString = JSON.stringify(message);
      const json = JSON.parse(jsonString);

      expect(json).toEqual({
        type: 'document',
        document: {
          link: 'https://example.com/document.pdf',
          filename: 'important.pdf',
        },
      });
    });

    it('should handle empty document message', () => {
      const message = new DocumentMessage();

      const jsonString = JSON.stringify(message);
      const json = JSON.parse(jsonString);

      expect(json).toEqual({
        type: 'document',
        document: {},
      });
    });
  });
});
