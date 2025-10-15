/**
 * Security Utilities
 * 
 * Functions to sanitize and validate user inputs to prevent security vulnerabilities
 */

/**
 * Sanitize phone number for WhatsApp URL
 * Removes all non-numeric characters and validates format
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Remove leading zeros and country code prefixes
  let sanitized = cleaned.replace(/^0+/, '');
  
  // If it starts with 62 (Indonesia), keep it, otherwise add 62
  if (!sanitized.startsWith('62')) {
    sanitized = '62' + sanitized;
  }
  
  // Validate length (Indonesian phone numbers should be 10-13 digits after country code)
  if (sanitized.length < 10 || sanitized.length > 15) {
    throw new Error('Invalid phone number format');
  }
  
  return sanitized;
}

/**
 * Sanitize WhatsApp message text
 * Removes potentially dangerous characters and limits length
 */
export function sanitizeWhatsAppMessage(message: string): string {
  if (!message) return '';
  
  // Limit message length to prevent abuse
  const maxLength = 1000;
  let sanitized = message.substring(0, maxLength);
  
  // Remove potentially dangerous characters
  sanitized = sanitized
    .replace(/[<>]/g, '') // Remove HTML-like characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
  
  return sanitized;
}

/**
 * Validate and sanitize WhatsApp URL
 * Ensures the URL is safe and properly formatted
 */
export function createSafeWhatsAppUrl(phone: string, message: string): string {
  try {
    const sanitizedPhone = sanitizePhoneNumber(phone);
    const sanitizedMessage = sanitizeWhatsAppMessage(message);
    
    // Create safe WhatsApp URL
    const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(sanitizedMessage)}`;
    
    // Validate the URL format
    new URL(whatsappUrl);
    
    return whatsappUrl;
  } catch (error) {
    throw new Error('Invalid phone number or message for WhatsApp URL');
  }
}

/**
 * Sanitize file name for uploads
 * Removes dangerous characters and limits length
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return 'unnamed';
  
  // Remove path traversal attempts
  let sanitized = fileName.replace(/\.\./g, '');
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '_');
  
  // Limit length
  sanitized = sanitized.substring(0, 100);
  
  // Ensure it has an extension
  if (!sanitized.includes('.')) {
    sanitized += '.file';
  }
  
  return sanitized;
}

/**
 * Validate file type for uploads
 * Checks MIME type and file extension
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  if (!file || !allowedTypes.length) return false;
  
  // Check MIME type
  const mimeTypeValid = allowedTypes.some(type => file.type.startsWith(type));
  
  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  const extensionValid = allowedTypes.some(type => {
    const expectedExt = type.split('/')[1];
    return extension === expectedExt;
  });
  
  return mimeTypeValid || extensionValid;
}

/**
 * Sanitize HTML content
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*javascript\s*:/gi, '');
  sanitized = sanitized.replace(/\s*vbscript\s*:/gi, '');
  sanitized = sanitized.replace(/\s*data\s*:/gi, '');
  
  // Remove dangerous tags
  sanitized = sanitized.replace(/<(iframe|object|embed|link|meta)\b[^>]*>/gi, '');
  
  return sanitized;
}

/**
 * Validate email format
 * Basic email validation with security considerations
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  
  // Basic email regex (not too strict to avoid false negatives)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Check length
  if (email.length > 254) return false;
  
  // Check for dangerous characters
  if (/[<>]/.test(email)) return false;
  
  return emailRegex.test(email);
}

/**
 * Generate secure random string
 * For use in nonces, tokens, etc.
 */
export function generateSecureRandom(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.getRandomValues if available (browser)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for Node.js or older browsers
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}
