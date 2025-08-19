// Currency conversion utilities for Paystack integration
// All conversions target NGN since Paystack merchant account supports NGN

// Current exchange rates as of July 2025 (Updated with real market rates)
export const EXCHANGE_RATES = {
  EUR_TO_NGN: 1650,  // 1 EUR = 1650 NGN
  USD_TO_NGN: 1529,  // 1 USD = 1529 NGN (Updated from XE.com - Paystack compatible rate)
  GBP_TO_NGN: 1940,  // 1 GBP = 1940 NGN
};

export interface CurrencyConversion {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: 'NGN';
  amountInKobo: number;
  exchangeRate: number;
}

/**
 * Convert any supported currency to NGN for Paystack processing
 * @param amount - Amount in the original currency
 * @param fromCurrency - Original currency (EUR, USD, GBP)
 * @param basePrice - If provided and fromCurrency is not EUR, will convert base price first
 * @returns Conversion details including amount in kobo
 */
export function convertToNGN(
  amount: number, 
  fromCurrency: string,
  basePrice?: number
): CurrencyConversion {
  let amountInNGN: number;
  let exchangeRate: number;
  let actualAmount = amount;

  // If base price is provided and currency is not EUR, we need to convert from EUR first
  if (basePrice && fromCurrency !== 'EUR') {
    // Assuming base prices are stored in EUR, convert to the display currency first
    if (fromCurrency === 'USD') {
      actualAmount = basePrice * 1.05; // EUR to USD rate
    } else if (fromCurrency === 'GBP') {
      actualAmount = basePrice * 0.85; // EUR to GBP rate
    }
  }

  switch (fromCurrency.toUpperCase()) {
    case 'EUR':
      exchangeRate = EXCHANGE_RATES.EUR_TO_NGN;
      amountInNGN = actualAmount * exchangeRate;
      break;
    
    case 'USD':
      exchangeRate = EXCHANGE_RATES.USD_TO_NGN;
      amountInNGN = actualAmount * exchangeRate;
      break;
    
    case 'GBP':
      exchangeRate = EXCHANGE_RATES.GBP_TO_NGN;
      amountInNGN = actualAmount * exchangeRate;
      break;
    
    case 'NGN':
      // Already in NGN, no conversion needed
      exchangeRate = 1;
      amountInNGN = actualAmount;
      break;
    
    default:
      // Default to EUR rate for unknown currencies
      console.warn(`Unknown currency ${fromCurrency}, using EUR rate`);
      exchangeRate = EXCHANGE_RATES.EUR_TO_NGN;
      amountInNGN = actualAmount * exchangeRate;
      break;
  }

  // Convert to kobo (NGN subunit) and round
  const amountInKobo = Math.round(amountInNGN * 100);

  return {
    originalAmount: actualAmount,
    originalCurrency: fromCurrency,
    convertedAmount: amountInNGN,
    convertedCurrency: 'NGN',
    amountInKobo,
    exchangeRate
  };
}

/**
 * Log conversion details for debugging
 */
export function logConversion(conversion: CurrencyConversion, context?: string) {
  console.log(`Currency conversion${context ? ` (${context})` : ''}:`, {
    from: `${conversion.originalCurrency} ${conversion.originalAmount.toFixed(2)}`,
    to: `NGN ${conversion.convertedAmount.toFixed(2)}`,
    kobo: conversion.amountInKobo,
    rate: `1 ${conversion.originalCurrency} = ${conversion.exchangeRate} NGN`
  });
}

/**
 * Get user-friendly display of the conversion (for admin/debug purposes)
 */
export function getConversionDisplay(conversion: CurrencyConversion): string {
  return `${conversion.originalCurrency} ${conversion.originalAmount.toFixed(2)} → NGN ${conversion.convertedAmount.toFixed(2)}`;
}
