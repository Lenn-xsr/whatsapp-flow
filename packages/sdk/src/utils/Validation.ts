import { ValidationError } from '../errors';

/**
 * Validates if a string is a valid URL
 * @param url - The URL to validate
 * @returns True if valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid phone number (basic validation)
 * @param phoneNumber - The phone number to validate
 * @returns True if valid, false otherwise
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Basic validation: at least 10 digits, can contain +, spaces, dashes, parentheses
  const phoneRegex = /^[+]?[1-9][\d]{9,15}$/;
  const cleanNumber = phoneNumber.replace(/[\s\-()]/g, '');
  return phoneRegex.test(cleanNumber);
}

/**
 * Validates if a string is not empty
 * @param value - The value to validate
 * @returns True if not empty, false otherwise
 */
export function isNotEmpty(value: string): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

/**
 * Validates a required field
 * @param value - The value to validate
 * @param fieldName - The name of the field for error messages
 * @throws ValidationError if validation fails
 */
export function validateRequired(value: unknown, fieldName: string): void {
  if (value === null || value === undefined || (typeof value === 'string' && !isNotEmpty(value))) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
}

/**
 * Validates a URL field
 * @param url - The URL to validate
 * @param fieldName - The name of the field for error messages
 * @throws ValidationError if validation fails
 */
export function validateUrl(url: string, fieldName: string): void {
  validateRequired(url, fieldName);
  if (!isValidUrl(url)) {
    throw new ValidationError(`${fieldName} must be a valid URL`, fieldName);
  }
}

/**
 * Validates a phone number field
 * @param phoneNumber - The phone number to validate
 * @param fieldName - The name of the field for error messages
 * @throws ValidationError if validation fails
 */
export function validatePhoneNumber(phoneNumber: string, fieldName: string): void {
  validateRequired(phoneNumber, fieldName);
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new ValidationError(`${fieldName} must be a valid phone number`, fieldName);
  }
}

/**
 * Validates if a string contains only valid WhatsApp message characters
 * @param text - The text to validate
 * @returns True if valid, false otherwise
 */
export function isValidWhatsAppText(text: string): boolean {
  // WhatsApp supports Unicode including emojis, but has a 4096 character limit for messages
  return text.length <= 4096;
}

/**
 * Validates a WhatsApp text message
 * @param text - The text to validate
 * @param fieldName - The name of the field for error messages
 * @throws ValidationError if validation fails
 */
export function validateWhatsAppText(text: string, fieldName: string): void {
  validateRequired(text, fieldName);
  if (!isValidWhatsAppText(text)) {
    throw new ValidationError(
      `${fieldName} exceeds WhatsApp message limit of 4096 characters`,
      fieldName,
    );
  }
}

/**
 * Validates if a string is a valid media URL for WhatsApp
 * @param url - The URL to validate
 * @returns True if valid, false otherwise
 */
export function isValidMediaUrl(url: string): boolean {
  if (!isValidUrl(url)) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    // Check for common media file extensions
    const mediaExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.mp4',
      '.mp3',
      '.pdf',
      '.doc',
      '.docx',
    ];
    const hasMediaExtension = mediaExtensions.some((ext) =>
      parsedUrl.pathname.toLowerCase().endsWith(ext),
    );

    return (
      hasMediaExtension ||
      parsedUrl.pathname.includes('/media/') ||
      parsedUrl.searchParams.has('media')
    );
  } catch {
    return false;
  }
}

/**
 * Validates a media URL field
 * @param url - The URL to validate
 * @param fieldName - The name of the field for error messages
 * @throws ValidationError if validation fails
 */
export function validateMediaUrl(url: string, fieldName: string): void {
  validateRequired(url, fieldName);
  if (!isValidMediaUrl(url)) {
    throw new ValidationError(`${fieldName} must be a valid media URL`, fieldName);
  }
}
