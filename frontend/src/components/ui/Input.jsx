import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Input = forwardRef(({ className, type, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400">
            {leftIcon}
          </div>
        )}
        <input
          type={inputType}
          className={cn(
            "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-secondary-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:bg-secondary-50 disabled:text-secondary-500 placeholder:text-secondary-400",
            error ? "border-error-500 focus-visible:ring-error-500" : "border-secondary-300",
            leftIcon && "pl-10",
            (rightIcon || isPassword) && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        {(rightIcon || isPassword) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isPassword ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-secondary-400 hover:text-secondary-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            ) : (
              <div className="text-secondary-400 pointer-events-none">{rightIcon}</div>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-error-500">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-sm text-secondary-500">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
