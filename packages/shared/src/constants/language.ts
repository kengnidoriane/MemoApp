/**
 * Language and localization constants
 */

export enum Language {
  ENGLISH = 'en',
  FRENCH = 'fr'
}

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = [
  Language.ENGLISH,
  Language.FRENCH
] as const;

/**
 * Language labels
 */
export const LANGUAGE_LABELS: Record<Language, string> = {
  [Language.ENGLISH]: 'English',
  [Language.FRENCH]: 'Français'
};

/**
 * Language native labels
 */
export const LANGUAGE_NATIVE_LABELS: Record<Language, string> = {
  [Language.ENGLISH]: 'English',
  [Language.FRENCH]: 'Français'
};

/**
 * Default language configuration
 */
export const DEFAULT_LANGUAGE_CONFIG = {
  defaultLanguage: Language.ENGLISH,
  fallbackLanguage: Language.ENGLISH,
  autoDetect: true
};

/**
 * Date format patterns by language
 */
export const DATE_FORMATS: Record<Language, string> = {
  [Language.ENGLISH]: 'MM/dd/yyyy',
  [Language.FRENCH]: 'dd/MM/yyyy'
};

/**
 * Time format patterns by language
 */
export const TIME_FORMATS: Record<Language, string> = {
  [Language.ENGLISH]: 'h:mm a',
  [Language.FRENCH]: 'HH:mm'
};

/**
 * Number format locales by language
 */
export const NUMBER_LOCALES: Record<Language, string> = {
  [Language.ENGLISH]: 'en-US',
  [Language.FRENCH]: 'fr-FR'
};

/**
 * Number format options by language
 */
export const NUMBER_FORMAT_OPTIONS: Record<Language, Intl.NumberFormatOptions> = {
  [Language.ENGLISH]: {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  },
  [Language.FRENCH]: {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }
};

/**
 * Currency format options by language
 */
export const CURRENCY_FORMAT_OPTIONS: Record<Language, Intl.NumberFormatOptions> = {
  [Language.ENGLISH]: {
    style: 'currency',
    currency: 'USD'
  },
  [Language.FRENCH]: {
    style: 'currency',
    currency: 'EUR'
  }
};