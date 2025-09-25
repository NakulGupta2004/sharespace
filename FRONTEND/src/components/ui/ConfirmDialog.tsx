import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-xs border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center">
          <div className="text-4xl mb-2">🗑️</div>
          <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">Confirm Delete</h3>
          <p className="mb-6 text-center text-gray-700 dark:text-gray-300">{message}</p>
          <div className="flex gap-4 w-full justify-center">
            <button
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold transition shadow"
              onClick={onConfirm}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
