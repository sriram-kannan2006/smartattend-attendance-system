import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger'
}) => {
  const icons = {
    danger: <AlertCircle className="h-6 w-6 text-error-600" />,
    warning: <AlertTriangle className="h-6 w-6 text-warning-600" />,
    info: <Info className="h-6 w-6 text-info-600" />
  };

  const buttonVariants = {
    danger: 'danger',
    warning: 'primary',
    info: 'primary'
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm">
      <div className="sm:flex sm:items-start">
        <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 bg-${variant === 'danger' ? 'error' : variant === 'warning' ? 'warning' : 'info'}-100`}>
          {icons[variant]}
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <h3 className="text-lg font-semibold leading-6 text-secondary-900" id="modal-title">
            {title}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-secondary-500">
              {message}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-2">
        <Button
          variant={buttonVariants[variant]}
          onClick={handleConfirm}
          className="w-full sm:w-auto"
        >
          {confirmText}
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          className="mt-3 w-full sm:mt-0 sm:w-auto"
        >
          {cancelText}
        </Button>
      </div>
    </Modal>
  );
};
