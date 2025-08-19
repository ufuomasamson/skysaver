import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

export interface PaystackInitializeData {
  email: string;
  amount: number; // In kobo (smallest currency unit)
  currency?: string;
  reference: string;
  callback_url?: string;
  metadata?: {
    booking_id: string;
    user_id: string;
    flight_id: string;
    custom_fields?: any[];
  };
  channels?: string[];
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: {
      booking_id: string;
      user_id: string;
      flight_id: string;
    };
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: any;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
  };
}

export class PaystackService {
  private static async getPaystackKeys() {
    try {
      const supabase = createServerSupabaseClient();
      
      const { data: apiKeys, error: keysError } = await supabase
        .from(TABLES.PAYMENT_GATEWAYS)
        .select('*')
        .eq('name', 'paystack');

      console.log('Paystack keys from database:', apiKeys);
      console.log('Database error:', keysError);

      if (keysError || !apiKeys || apiKeys.length === 0) {
        throw new Error('Paystack payment gateway not configured');
      }

      const keys: { [key: string]: string } = {};
      apiKeys.forEach(key => {
        if (key.api_key) {
          keys[key.type] = key.api_key;
        }
      });

      console.log('Processed keys object:', keys);
      return keys;
    } catch (error) {
      console.error('Error fetching Paystack keys:', error);
      throw new Error('Paystack payment gateway not configured');
    }
  }

  static async initializePayment(paymentData: PaystackInitializeData): Promise<PaystackInitializeResponse> {
    try {
      const keys = await this.getPaystackKeys();
      
      // Use test keys for development, live keys for production
      // Fallback to live keys if test keys are not configured
      const isProduction = process.env.NODE_ENV === 'production';
      let secretKey = isProduction ? keys.live_secret : keys.test_secret;
      
      // If test key is not available in development, fallback to live key
      if (!secretKey && !isProduction && keys.live_secret) {
        secretKey = keys.live_secret;
        console.log('Using live secret key as fallback in development');
      }

      console.log('Environment check:', {
        NODE_ENV: process.env.NODE_ENV,
        isProduction,
        availableKeys: Object.keys(keys),
        selectedSecretKey: secretKey ? 'Found' : 'Not found'
      });

      if (!secretKey) {
        throw new Error('Paystack secret key not configured');
      }

      // Convert amount to kobo (multiply by 100 for NGN, keep as is for other currencies)
      const amountInKobo = paymentData.currency === 'NGN' 
        ? Math.round(paymentData.amount * 100) 
        : Math.round(paymentData.amount * 100); // Paystack expects amounts in smallest currency unit

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretKey}`,
        },
        body: JSON.stringify({
          email: paymentData.email,
          amount: amountInKobo,
          currency: paymentData.currency || 'NGN',
          reference: paymentData.reference,
          callback_url: paymentData.callback_url,
          metadata: paymentData.metadata,
          channels: paymentData.channels || ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Paystack initialization error:', result);
        return {
          status: false,
          message: result.message || 'Payment initialization failed'
        };
      }

      if (result.status) {
        return {
          status: true,
          message: 'Payment initialized successfully',
          data: result.data
        };
      } else {
        return {
          status: false,
          message: result.message || 'Payment initialization failed'
        };
      }
    } catch (error) {
      console.error('Paystack initialization error:', error);
      return {
        status: false,
        message: error instanceof Error ? error.message : 'Payment initialization failed'
      };
    }
  }

  static async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const keys = await this.getPaystackKeys();
      
      const isProduction = process.env.NODE_ENV === 'production';
      const secretKey = isProduction ? keys.live_secret : keys.test_secret;

      if (!secretKey) {
        throw new Error('Paystack secret key not configured');
      }

      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Paystack verification error:', result);
        return {
          status: false,
          message: result.message || 'Payment verification failed'
        };
      }

      return result;
    } catch (error) {
      console.error('Paystack verification error:', error);
      return {
        status: false,
        message: error instanceof Error ? error.message : 'Payment verification failed'
      };
    }
  }

  static generateReference(): string {
    return `PS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static convertAmountToKobo(amount: number, currency: string = 'NGN'): number {
    // Paystack expects amounts in kobo for NGN (multiply by 100)
    // For other currencies, check Paystack documentation
    if (currency === 'NGN') {
      return Math.round(amount * 100);
    }
    // For USD, GHS, ZAR, and other supported currencies, multiply by 100
    return Math.round(amount * 100);
  }

  static convertKoboToAmount(kobo: number, currency: string = 'NGN'): number {
    return kobo / 100;
  }
}
