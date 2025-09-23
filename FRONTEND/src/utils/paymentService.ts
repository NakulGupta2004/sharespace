import axios from 'axios';

// Define Razorpay window interface
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentData {
  bookingId: string;
  amount: number;
  currency: string;
  description: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

export class PaymentService {
  private static readonly API_BASE_URL = 'http://localhost:5000/api';

  static async createPaymentOrder(paymentData: PaymentData): Promise<any> {
    try {
      const token = localStorage.getItem('sharespace_token');
      console.log('Creating payment order with token:', token ? 'Token exists' : 'No token');
      console.log('Payment data:', paymentData);
      
      const response = await axios.post(
        `${this.API_BASE_URL}/payments/create-order`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Payment order response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to create payment order');
    }
  }

  static async verifyPayment(verificationData: any): Promise<any> {
    try {
      const token = localStorage.getItem('sharespace_token');
      const response = await axios.post(
        `${this.API_BASE_URL}/payments/verify`,
        verificationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  }

  static async initiatePayment(
    paymentData: PaymentData,
    userInfo: { name: string; email: string },
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void
  ): Promise<void> {
    try {
      // Step 1: Create order on backend
      const orderResponse = await this.createPaymentOrder(paymentData);
      console.log('Order response received:', orderResponse);
      
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error('Invalid response from payment service');
      }
      
      const { orderId, amount, currency } = orderResponse.data;

      // Step 2: Configure Razorpay options
      const options: RazorpayOptions = {
        key: 'rzp_test_RAi5uQX3MTrzfi', // Test key
        amount: amount, // Amount in paise (already converted in backend)
        currency: currency,
        name: 'ShareSpace',
        description: paymentData.description,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            // Step 3: Verify payment on backend
            const verificationData = {
              bookingId: paymentData.bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verificationResponse = await this.verifyPayment(verificationData);
            onSuccess(verificationResponse);
          } catch (error) {
            console.error('Payment verification failed:', error);
            onFailure(error);
          }
        },
        prefill: {
          name: userInfo.name,
          email: userInfo.email,
        },
        theme: {
          color: '#3B82F6', // Blue theme matching our app
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            onFailure(new Error('Payment cancelled by user'));
          },
        },
      };

      // Step 4: Open Razorpay checkout
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay SDK not loaded');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      onFailure(error);
    }
  }
}