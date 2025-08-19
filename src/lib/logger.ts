// Enhanced logging utility for payment debugging
export class PaymentLogger {
  private static logToConsole = true;
  private static logToFile = false; // For future file logging

  static log(level: 'INFO' | 'ERROR' | 'DEBUG' | 'WARN', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined
    };

    if (this.logToConsole) {
      console.log(`[${timestamp}] [${level}] ${message}`, data || '');
    }

    // Future: write to log file or external logging service
    if (this.logToFile) {
      // Could implement file logging here
    }
  }

  static info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  static error(message: string, data?: any) {
    this.log('ERROR', message, data);
  }

  static debug(message: string, data?: any) {
    this.log('DEBUG', message, data);
  }

  static warn(message: string, data?: any) {
    this.log('WARN', message, data);
  }

  // Payment-specific logging methods
  static paymentStart(reference: string, data?: any) {
    this.info(`Payment verification started`, { reference, ...data });
  }

  static paymentSuccess(reference: string, data?: any) {
    this.info(`Payment verification successful`, { reference, ...data });
  }

  static paymentError(reference: string, error: any, data?: any) {
    this.error(`Payment verification failed`, { reference, error: error.message || error, ...data });
  }

  static paystackRequest(endpoint: string, method: string, reference?: string) {
    this.debug(`Paystack API request`, { endpoint, method, reference });
  }

  static paystackResponse(endpoint: string, status: number, data?: any) {
    this.debug(`Paystack API response`, { endpoint, status, response: data });
  }

  static databaseOperation(operation: string, table: string, success: boolean, error?: any) {
    if (success) {
      this.debug(`Database ${operation} successful`, { table });
    } else {
      this.error(`Database ${operation} failed`, { table, error: error?.message || error });
    }
  }
}
