import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Modal = ({
  open,
  isOpen,
  onOpenChange,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md'
}) => {
  const isModalOpen = open !== undefined ? open : isOpen;
  const handleOpenChange = (val) => {
    if (onOpenChange) onOpenChange(val);
    if (!val && onClose) onClose();
  };

  const sizeClasses = {
    sm: 'sm:max-w-[425px]',
    md: 'sm:max-w-[520px]',
    lg: 'sm:max-w-[800px]',
    xl: 'sm:max-w-[1000px]',
    full: 'sm:max-w-[95vw] sm:max-h-[95vh]',
  };

  return (
    <Dialog.Root open={!!isModalOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-[92vw] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-3xl",
          sizeClasses[size]
        )}>
          <div className="flex flex-col space-y-1.5 text-left pr-6">
            {title && (
              <Dialog.Title className="text-lg font-bold leading-none tracking-tight text-slate-900">
                {title}
              </Dialog.Title>
            )}
            {description && (
              <Dialog.Description className="text-xs text-slate-500">
                {description}
              </Dialog.Description>
            )}
          </div>
          
          <div className="py-2">
            {children}
          </div>
          
          {footer && (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2 border-t border-slate-100">
              {footer}
            </div>
          )}
          
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition focus:outline-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;
