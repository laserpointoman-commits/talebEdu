/**
 * Utility functions for handling bidirectional text in RTL/LTR contexts
 */

/**
 * Wraps numbers and English text to ensure they display LTR even in RTL context
 * This is important for phone numbers, amounts, IDs, etc.
 */
export function wrapBidiText(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return '';
  
  const strText = String(text);
  
  // Check if the text contains numbers or Latin characters
  const hasNumbers = /\d/.test(strText);
  const hasLatinChars = /[a-zA-Z]/.test(strText);
  
  if (hasNumbers || hasLatinChars) {
    // Wrap in a unicode directional mark to ensure LTR display
    return `\u202D${strText}\u202C`; // LTR override with pop directional formatting
  }
  
  return strText;
}

/**
 * CSS class for elements containing bidirectional text
 * Use this for containers that might have mixed RTL/LTR content
 */
export const bidiTextClass = "unicode-bidi-plaintext";

/**
 * CSS class for forcing LTR direction (useful for numbers, codes, etc.)
 */
export const ltrClass = "direction-ltr text-left";

/**
 * CSS class for elements that should always be LTR (like phone numbers, amounts)
 */
export const alwaysLtrClass = "!direction-ltr !text-left";