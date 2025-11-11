
import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from './icons/Icons';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-600' : 'bg-red-600';
  const Icon = isSuccess ? CheckCircleIcon : XCircleIcon;

  return (
    <div className="fixed top-5 right-5 z-[100] animate-slide-in-right">
      <div className={`${bgColor} text-white font-bold rounded-lg shadow-lg flex items-center py-3 px-4`}>
        <Icon className="w-6 h-6 mr-3 flex-shrink-0" />
        <span className="flex-grow">{message}</span>
        <button onClick={onClose} className="ml-4 -mr-1 p-1 rounded-full hover:bg-white/20 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>
       <style>{`
            @keyframes slide-in-right {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            .animate-slide-in-right {
                animation: slide-in-right 0.3s ease-out forwards;
            }
        `}</style>
    </div>
  );
};

export default Toast;
