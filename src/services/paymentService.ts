export interface PaymentInitiationRequest {
  bookingId: string;
  userId: string;
  amount: number;
  currency?: string;
}

export interface PaymentInitiationResponse {
  success: boolean;
  data?: {
    payment_url: string;
    tx_ref: string;
    status: string;
  };
  error?: string;
}

export interface PaymentVerificationRequest {
  tx_ref: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message?: string;
  data?: {
    booking_id: string;
    transaction_ref: string;
    amount: number;
    currency: string;
    status: string;
  };
  error?: string;
}

export class PaymentService {
  static async initiatePayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    try {
      const response = await fetch('/api/payment/initiate-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Payment initiation failed'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment initiation failed'
      };
    }
  }

  static async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Payment verification failed'
        };
      }

      return {
        success: true,
        message: result.message,
        data: result.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment verification failed'
      };
    }
  }

  static redirectToPayment(paymentUrl: string): void {
    if (typeof window !== 'undefined') {
      window.location.href = paymentUrl;
    }
  }
} 