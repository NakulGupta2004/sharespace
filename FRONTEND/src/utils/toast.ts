import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      icon: '✅',
    });
  },

  error: (message: string) => {
    toast.error(message, {
      icon: '❌',
    });
  },

  info: (message: string) => {
    toast(message, {
      icon: 'ℹ️',
    });
  },

  warning: (message: string) => {
    toast(message, {
      icon: '⚠️',
      style: {
        background: 'rgba(245, 158, 11, 0.95)',
        color: 'white',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '16px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    });
  },
};