import React from 'react';
import { FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export const EmptyState = ({ 
  icon: Icon = FileQuestion, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center min-h-[300px]", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100 mb-4">
        <Icon className="h-8 w-8 text-secondary-500" />
      </div>
      <h3 className="text-lg font-medium text-secondary-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-secondary-500 max-w-sm mb-6">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
