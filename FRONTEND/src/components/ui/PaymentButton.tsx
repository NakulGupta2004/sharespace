import React, { useState } from 'react';
import { Button } from './Button';
import { PaymentService } from '../../utils/paymentService';

interface PaymentButtonProps {
  bookingId: string;
  amount: number;
  currency?: string;
  description: string;
  userInfo: {
    name: string;
    email: string;
  };
  onSuccess?: (response: any) => void;
  onFailure?: (error: any) => void;
  className?: string;
  disabled?: boolean;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  bookingId,
  amount,
  currency = 'INR',
  description,
  userInfo,
  onSuccess,
  onFailure,
  className = '',
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      await PaymentService.initiatePayment(
        {
          bookingId,
          amount,
          currency,
          description,
        },
        userInfo,
        (response) => {
          setLoading(false);
          console.log('Payment successful:', response);
          onSuccess?.(response);
        },
        (error) => {
          setLoading(false);
          console.error('Payment failed:', error);
          onFailure?.(error);
        }
      );
    } catch (error) {
      setLoading(false);
      console.error('Payment initialization failed:', error);
      onFailure?.(error);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
      variant="default"
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Processing...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Pay Now</span>
        </div>
      )}
    </Button>
  );
};