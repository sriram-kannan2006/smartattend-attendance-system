import React from 'react';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-secondary-200",
  {
    variants: {
      variant: {
        text: "h-4 w-full",
        circular: "rounded-full",
        rectangular: "h-full w-full",
      }
    },
    defaultVariants: {
      variant: "text"
    }
  }
);

export const Skeleton = ({ className, variant, width, height, ...props }) => {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      style={{ width, height }}
      {...props}
    />
  );
};
