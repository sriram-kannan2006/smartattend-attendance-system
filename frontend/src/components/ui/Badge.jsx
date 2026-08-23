import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-secondary-100 text-secondary-900",
        primary: "bg-primary-100 text-primary-800",
        success: "bg-success-100 text-success-800",
        warning: "bg-warning-100 text-warning-800",
        error: "bg-error-100 text-error-800",
        info: "bg-info-100 text-info-800",
        outline: "border border-secondary-200 text-secondary-900 bg-transparent",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);

export const Badge = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <div ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
});

Badge.displayName = "Badge";
