
export interface PaymentData {
  amount: number;
  currency: string;
  email: string;
  phone_number: string;
  name: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
}

export interface PaymentResponse {
  status: string;
  message: string;
  data?: Record<string, unknown>;
}

export class PaymentService {
  private static async getFlutterwaveKeys() {
    try {
      // Fetch payment gateway keys from Appwrite via API route
      const response = await fetch('/api/payment-keys?gateway=flutterwave');
      if (!response.ok) throw new Error('Payment gateway not configured');
      const keys = await response.json();
      return keys;
    } catch (error) {
      console.error('Error fetching Flutterwave keys:', error);
      throw new Error('Payment gateway not configured');
    }
  }

  static async initializePayment(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      const keys = await this.getFlutterwaveKeys();
      
      // Use test keys for development, live keys for production
      const isProduction = process.env.NODE_ENV === 'production';
      const publicKey = isProduction ? keys.live_public : keys.test_public;
      const secretKey = isProduction ? keys.live_secret : keys.test_secret;

      if (!publicKey || !secretKey) {
        throw new Error('Payment gateway keys not configured');
      }

      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretKey}`,
        },
        body: JSON.stringify({
          tx_ref: paymentData.tx_ref,
          amount: paymentData.amount,
          currency: paymentData.currency,
          redirect_url: paymentData.return_url,
          customer: {
            email: paymentData.email,
            phone_number: paymentData.phone_number,
            name: paymentData.name,
          },
          customizations: paymentData.customizations,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        return {
          status: 'success',
          message: 'Payment initialized successfully',
          data: result.data,
        };
      } else {
        return {
          status: 'error',
          message: result.message || 'Failed to initialize payment',
        };
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Payment initialization failed',
      };
    }
  }

  static async verifyPayment(transactionId: string): Promise<PaymentResponse> {
    try {
      const keys = await this.getFlutterwaveKeys();
      
      const isProduction = process.env.NODE_ENV === 'production';
      const secretKey = isProduction ? keys.live_secret : keys.test_secret;

      if (!secretKey) {
        throw new Error('Payment gateway keys not configured');
      }

      const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      });

      const result = await response.json();

      if (result.status === 'success' && result.data.status === 'successful') {
        return {
          status: 'success',
          message: 'Payment verified successfully',
          data: result.data,
        };
      } else {
        return {
          status: 'error',
          message: result.message || 'Payment verification failed',
        };
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Payment verification failed',
      };
    }
  }

  static generateTransactionRef(): string {
    return `FLW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
} 