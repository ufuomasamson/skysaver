# Currency Conversion for Paystack Integration

## Overview
Implemented automatic currency conversion to NGN for Paystack processing while maintaining international customer privacy. Users see prices in their preferred currency (EUR/USD/GBP) but payments are processed in NGN behind the scenes.

## Key Features

### 🔄 **Automatic Conversion**
- All payments converted to NGN before sending to Paystack
- Users never see NGN amounts - maintains international appearance
- Centralized conversion logic in `/src/lib/currencyConversion.ts`

### 💱 **Current Exchange Rates (July 2025)**
- **EUR → NGN**: 1 EUR = 1,650 NGN
- **USD → NGN**: 1 USD = 1,570 NGN  
- **GBP → NGN**: 1 GBP = 1,940 NGN

### 🎯 **Implementation Details**

#### Components Updated:
1. **InlinePaymentModal** - Converts user's currency to NGN before API call
2. **Track Page** - Legacy payment handler updated for NGN conversion
3. **API Routes** - Now only accept NGN to ensure consistency

#### Conversion Flow:
```
User sees: EUR 1.85
↓ (Hidden conversion)
Paystack processes: NGN 3,052.50
↓ (User never sees NGN)
Payment confirmation in original currency
```

### 🛡️ **Privacy Protection**
- **Customer View**: Only sees EUR/USD/GBP prices
- **Internal Processing**: All payments in NGN
- **Company Benefit**: Appears as international business
- **Paystack Compatibility**: Uses supported NGN currency

### 🧪 **Testing**
- Demo page at `/payment-demo` shows conversion preview
- Real-time currency selector to test different conversions
- Console logging for debugging conversion rates

### 📊 **Conversion Examples**
- EUR 1.85 → NGN 3,052.50 (Rate: 1,650)
- USD 1.95 → NGN 3,061.50 (Rate: 1,570)  
- GBP 1.58 → NGN 3,065.20 (Rate: 1,940)

## Benefits
✅ **International Appearance** - No NGN visible to customers
✅ **Paystack Compatibility** - Uses supported NGN currency
✅ **Accurate Conversion** - Current market rates
✅ **Centralized Logic** - Easy to update rates
✅ **Privacy Maintained** - Company appears global
✅ **Seamless UX** - Users see familiar currencies
