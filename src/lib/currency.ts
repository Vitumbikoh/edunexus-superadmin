/**
 * Currency utilities for edunexus Admin
 * Supports MWK (Malawian Kwacha) and USD currencies
 */

export type Currency = 'MWK' | 'USD';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  locale: string;
}

/**
 * Currency configurations for Malawi-based system
 */
export const CURRENCY_CONFIGS: Record<Currency, CurrencyConfig> = {
  MWK: {
    code: 'MWK',
    symbol: 'MK',
    name: 'Malawian Kwacha',
    locale: 'en-MW'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US'
  }
};

/**
 * Format currency amount with proper symbol and locale
 */
export function formatCurrency(
  amount: number | string,
  currency: Currency = 'MWK',
  options: Intl.NumberFormatOptions = {}
): string {
  const config = CURRENCY_CONFIGS[currency];
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return `${config.symbol}0.00`;
  }

  try {
    const formatter = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    });

    return formatter.format(numAmount);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    return `${config.symbol}${numAmount.toFixed(2)}`;
  }
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency = 'MWK'): string {
  return CURRENCY_CONFIGS[currency].symbol;
}

/**
 * Get default currency for Malawi
 */
export function getDefaultCurrency(): Currency {
  return 'MWK';
}