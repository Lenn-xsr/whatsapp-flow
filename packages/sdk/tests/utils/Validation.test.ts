import {
  isValidUrl,
  isValidPhoneNumber,
  isNotEmpty,
  validateRequired,
  validateUrl,
  validatePhoneNumber,
} from '../../src/utils/Validation';
import { ValidationError } from '../../src/errors';

describe('Validation Utils', () => {
  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://subdomain.example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com:8080')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('ftp://invalid')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should return true for valid phone numbers', () => {
      expect(isValidPhoneNumber('15550001111')).toBe(true);
      expect(isValidPhoneNumber('+15550001111')).toBe(true);
      expect(isValidPhoneNumber('5550001111')).toBe(true);
      expect(isValidPhoneNumber('+5550001111')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhoneNumber('123')).toBe(false);
      expect(isValidPhoneNumber('abc')).toBe(false);
      expect(isValidPhoneNumber('')).toBe(false);
      expect(isValidPhoneNumber('0123456789')).toBe(false); // starts with 0
    });
  });

  describe('isNotEmpty', () => {
    it('should return true for non-empty strings', () => {
      expect(isNotEmpty('hello')).toBe(true);
      expect(isNotEmpty('  hello  ')).toBe(true);
      expect(isNotEmpty('0')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isNotEmpty('')).toBe(false);
      expect(isNotEmpty('   ')).toBe(false);
      expect(isNotEmpty('\t\n')).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should not throw for valid values', () => {
      expect(() => validateRequired('hello', 'field')).not.toThrow();
      expect(() => validateRequired(123, 'field')).not.toThrow();
      expect(() => validateRequired(false, 'field')).not.toThrow();
    });

    it('should throw ValidationError for null/undefined', () => {
      expect(() => validateRequired(null, 'field')).toThrow(ValidationError);
      expect(() => validateRequired(undefined, 'field')).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty strings', () => {
      expect(() => validateRequired('', 'field')).toThrow(ValidationError);
      expect(() => validateRequired('   ', 'field')).toThrow(ValidationError);
    });

    it('should include field name in error message', () => {
      try {
        validateRequired('', 'testField');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('testField');
      }
    });
  });

  describe('validateUrl', () => {
    it('should not throw for valid URLs', () => {
      expect(() => validateUrl('https://example.com', 'field')).not.toThrow();
    });

    it('should throw ValidationError for invalid URLs', () => {
      expect(() => validateUrl('not-a-url', 'field')).toThrow(ValidationError);
      expect(() => validateUrl('', 'field')).toThrow(ValidationError);
    });

    it('should include field name in error message', () => {
      try {
        validateUrl('invalid', 'urlField');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('urlField');
      }
    });
  });

  describe('validatePhoneNumber', () => {
    it('should not throw for valid phone numbers', () => {
      expect(() => validatePhoneNumber('15550001111', 'field')).not.toThrow();
    });

    it('should throw ValidationError for invalid phone numbers', () => {
      expect(() => validatePhoneNumber('123', 'field')).toThrow(ValidationError);
      expect(() => validatePhoneNumber('', 'field')).toThrow(ValidationError);
    });

    it('should include field name in error message', () => {
      try {
        validatePhoneNumber('invalid', 'phoneField');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('phoneField');
      }
    });
  });
});
