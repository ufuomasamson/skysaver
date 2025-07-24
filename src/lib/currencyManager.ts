import { create } from 'zustand';

interface CurrencyState {
  currency: string;
  setCurrency: (currency: string) => void;
  exchangeRates: Record<string, number>;
  formatPrice: (price: number, targetCurrency?: string) => string;
  convertPrice: (price: number, fromCurrency: string, toCurrency: string) => number;
  getAmount: (price: number, currency: string) => number;
}

// Exchange rates (base: EUR = 1.00) - Updated July 2025
const exchangeRates = {
  EUR: 1.00,      // Base currency
  USD: 1.05,      // 1 EUR = 1.05 USD (more accurate 2025 rate)
  GBP: 0.85       // 1 EUR = 0.85 GBP (more accurate 2025 rate)
};

// Currency symbols
const currencySymbols = {
  EUR: '€',
  USD: '$',
  GBP: '£'
};

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currency: typeof window !== 'undefined' && window.localStorage.getItem('currency')
    ? window.localStorage.getItem('currency') as string
    : 'EUR', // Default to EUR as requested
  exchangeRates,
  setCurrency: (currency) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('currency', currency);
    }
    set({ currency });
  },
  formatPrice: (price: number, targetCurrency?: string) => {
    const state = get();
    const currentCurrency = targetCurrency || state.currency;
    const symbol = currencySymbols[currentCurrency as keyof typeof currencySymbols] || '€';
    
    // Convert price from EUR (database default) to selected currency
    const convertedPrice = state.convertPrice(price, 'EUR', currentCurrency);
    return `${symbol}${Number(convertedPrice).toFixed(2)}`;
  },
  convertPrice: (price: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return price;
    
    // Convert from source currency to EUR (base), then to target currency
    const priceInEUR = price / exchangeRates[fromCurrency as keyof typeof exchangeRates];
    const convertedPrice = priceInEUR * exchangeRates[toCurrency as keyof typeof exchangeRates];
    
    return convertedPrice;
  },
  getAmount: (price: number, currency: string) => {
    const state = get();
    // Convert EUR price (database default) to the specified currency
    return state.convertPrice(price, 'EUR', currency);
  }
}));
