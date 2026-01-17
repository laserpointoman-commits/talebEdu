/**
 * Helper function for inline translations that support all 3 languages.
 * Use this for text that isn't in the central LanguageContext translations.
 * 
 * @param language - Current language ('en' | 'ar' | 'hi')
 * @param en - English text
 * @param ar - Arabic text
 * @param hi - Hindi text
 * @returns The text in the current language
 */
export const getText = (
  language: 'en' | 'ar' | 'hi',
  en: string,
  ar: string,
  hi: string
): string => {
  if (language === 'ar') return ar;
  if (language === 'hi') return hi;
  return en;
};

/**
 * Creates a bound getText function for a specific language.
 * Useful when you need to use getText multiple times in a component.
 * 
 * @param language - Current language
 * @returns A function that takes (en, ar, hi) and returns the appropriate text
 */
export const createGetText = (language: 'en' | 'ar' | 'hi') => {
  return (en: string, ar: string, hi: string): string => getText(language, en, ar, hi);
};
