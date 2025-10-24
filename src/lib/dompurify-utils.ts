/**
 * DOMPurify utilities for XSS protection
 * Sanitizes user input to prevent XSS attacks
 */

import DOMPurify from 'dompurify';

// Configure DOMPurify for different use cases
const config = {
  // For HTML content (strict)
  html: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
  // For text content (very strict)
  text: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
  // For search queries (moderate)
  search: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
  },
};

/**
 * Sanitize HTML content
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return as-is (DOMPurify needs DOM)
    return html;
  }
  
  return DOMPurify.sanitize(html, config.html);
}

/**
 * Sanitize text content (removes all HTML)
 * @param text - Text string to sanitize
 * @returns Sanitized text string
 */
export function sanitizeText(text: string): string {
  if (typeof window === 'undefined') {
    return text;
  }
  
  return DOMPurify.sanitize(text, config.text);
}

/**
 * Sanitize search query
 * @param query - Search query to sanitize
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof window === 'undefined') {
    return query;
  }
  
  return DOMPurify.sanitize(query, config.search);
}

/**
 * Sanitize user input for forms
 * @param input - User input to sanitize
 * @returns Sanitized input
 */
export function sanitizeUserInput(input: string): string {
  if (typeof window === 'undefined') {
    return input;
  }
  
  // Remove HTML tags and dangerous characters
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
}

/**
 * Sanitize URL parameters
 * @param param - URL parameter to sanitize
 * @returns Sanitized parameter
 */
export function sanitizeUrlParam(param: string): string {
  if (typeof window === 'undefined') {
    return param;
  }
  
  return DOMPurify.sanitize(param, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).replace(/[^a-zA-Z0-9\-_]/g, '');
}

/**
 * Check if content is safe (no dangerous HTML)
 * @param content - Content to check
 * @returns True if content is safe
 */
export function isContentSafe(content: string): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  
  const sanitized = DOMPurify.sanitize(content, config.text);
  return sanitized === content;
}
