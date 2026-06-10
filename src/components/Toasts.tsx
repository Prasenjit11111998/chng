import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast, ToastItem } from '../store/toastsSlice';
import {
  Check as CheckIcon,
  Ban as BanIcon,
  Info as InfoIcon,
  AlertTriangle as TriangleAlert,
  X as XIcon,
} from 'lucide-react';

export const Toasts: React.FC = () => {
  const toasts = useSelector((state: any) => state.toasts.toasts);
  const dispatch = useDispatch();

  const toastStyles = {
    success: 'bg-accent-purple border-accent-purple-alt',
    error: 'bg-accent-red border-accent-red-alt',
    info: 'bg-accent-blue border-accent-blue-alt',
    warning: 'bg-accent-pink border-accent-pink-alt',
  };

  const Icons = {
    success: CheckIcon,
    error: BanIcon,
    info: InfoIcon,
    warning: TriangleAlert,
  };

  return (
    <div className="fixed bottom-28 md:bottom-4 right-0 p-4 flex flex-col-reverse gap-4 z-50 pointer-events-none">
      {toasts.map((toast: ToastItem) => {
        const styleClass = toastStyles[toast.type] || toastStyles.info;
        const Icon = Icons[toast.type] || InfoIcon;

        return (
          <div key={toast.id} className="flex justify-end pointer-events-auto">
            <div
              className={`flex flex-row items-center justify-between w-full max-w-[100%] md:max-w-md p-4 gap-4 ${styleClass} border-l-4 rounded-lg shadow-md transition-all duration-300`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="w-6 h-6 text-on-accent flex-shrink-0"
                  size={24}
                  strokeWidth={2}
                />
                <p className="text-on-accent text-sm font-semibold whitespace-pre-wrap">
                  {toast.message}
                </p>
              </div>
              <button
                className="text-on-accent opacity-60 hover:opacity-100 flex-shrink-0 bg-transparent border-none cursor-pointer"
                onClick={() => dispatch(removeToast(toast.id))}
              >
                <XIcon size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default Toasts;
