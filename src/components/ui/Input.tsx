import React, { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  theme?: 'amber' | 'stage';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    label,
    error,
    leftIcon,
    rightIcon,
    required,
    theme = 'amber',
    type = 'text',
    ...props
  }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={props.id} 
            className={clsx(
              "block font-heading text-sm font-semibold mb-2",
              theme === 'amber' ? 'text-[#CAA870]' : 'text-primary-400'
            )}
          >
            {label}
            {required && <span className="ml-1 text-error-500">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className={clsx(
              "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none",
              theme === 'amber' ? 'text-[#CAA870]' : 'text-primary-400'
            )}>
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={clsx(
              'w-full px-4 py-3 rounded-lg bg-dark-800/25 backdrop-blur-lg backdrop-saturate-150',
              'border',
              'text-white placeholder-dark-400',
              'transition-colors duration-200',
              theme === 'amber' ? [
                'border-[#CAA87020]',
                'focus:border-[#CAA870] focus:ring-2 focus:ring-[#CAA870]/20 focus:outline-none'
              ] : [
                'border-primary-DEFAULT/20',
                'focus:border-primary-DEFAULT focus:ring-2 focus:ring-primary-DEFAULT/20 focus:outline-none'
              ],
              error && 'border-error-500 focus:ring-error-500/50',
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className={clsx(
              "absolute inset-y-0 right-0 pr-4 flex items-center",
              theme === 'amber' ? 'text-[#CAA870]' : 'text-primary-400'
            )}>
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-error-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';