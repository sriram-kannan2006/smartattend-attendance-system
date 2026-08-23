import React from 'react';
import { cva } from 'class-variance-authority';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-white text-secondary-900 border-secondary-200",
        info: "bg-info-50 text-info-900 border-info-200 [&>svg]:text-info-600",
        success: "bg-success-50 text-success-900 border-success-200 [&>svg]:text-success-600",
        warning: "bg-warning-50 text-warning-900 border-warning-200 [&>svg]:text-warning-600",
        error: "bg-error-50 text-error-900 border-error-200 [&>svg]:text-error-600",
      }
    },
    defaultVariants: {
      variant: "default",
    }
  }
);

export const Alert = React.forwardRef(({ className, variant, title, children, onClose, ...props }, ref) => {
  const icons = {
    default: Info,
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const Icon = icons[variant || 'default'];

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="h-5 w-5" />
      <div className="flex-1">
        {title && <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>}
        <div className="text-sm [&_p]:leading-relaxed">
          {children}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
    </div>
  );
});

Alert.displayName = "Alert";
