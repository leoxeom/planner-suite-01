import React, { ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
  theme?: 'amber' | 'stage';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    leftIcon, 
    rightIcon,
    glow = false,
    theme = 'amber',
    disabled,
    ...props 
  }, ref) => {
    const variants = {
      primary: clsx(
        'font-display uppercase tracking-wider text-white',
        theme === 'amber' ? [
          'bg-gradient-to-r from-[#FFBF00] to-[#CAA870]',
          'hover:from-[#FFBF00]/90 hover:to-[#CAA870]/90',
          'shadow-neon-amber',
          'hover:shadow-[0_0_10px_rgba(255,191,0,0.25)]',
        ] : [
          'bg-gradient-to-r from-primary-DEFAULT to-primary-600',
          'hover:from-primary-DEFAULT/90 hover:to-primary-600/90',
          'shadow-neon-blue',
          'hover:shadow-[0_0_10px_rgba(0,127,255,0.25)]',
        ],
        'border border-white/10'
      ),
      secondary: clsx(
        'bg-dark-800/50 backdrop-blur-sm text-white',
        theme === 'amber'
          ? 'hover:bg-dark-700/50 hover:text-[#CAA870]'
          : 'hover:bg-dark-700/50 hover:text-primary-400',
        'border border-white/10'
      ),
      ghost: clsx(
        'bg-transparent hover:bg-dark-800/30',
        theme === 'amber'
          ? 'text-dark-400 hover:text-[#CAA870]'
          : 'text-dark-400 hover:text-primary-400'
      ),
      outline: clsx(
        'bg-transparent border-2',
        theme === 'amber' ? [
          'border-[#CAA870]',
          'text-[#CAA870]',
          'hover:bg-[#CAA870]/10'
        ] : [
          'border-primary-DEFAULT',
          'text-primary-DEFAULT',
          'hover:bg-primary-DEFAULT/10'
        ]
      ),
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={clsx(
          'rounded-xl font-medium transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT/50',
          'flex items-center justify-center space-x-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          glow && 'animate-glow hover:animate-glow-hover',
          className
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          leftIcon && (
            <motion.span 
              className="mr-2"
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
            >
              {leftIcon}
            </motion.span>
          )
        )}
        <span>{children}</span>
        {rightIcon && !isLoading && (
          <motion.span 
            className="ml-2"
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
          >
            {rightIcon}
          </motion.span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';