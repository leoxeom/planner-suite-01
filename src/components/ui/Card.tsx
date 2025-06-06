import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  glass = false,
  glow = false,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl overflow-hidden relative',
        glass && [
          'bg-glass-dark',
          'backdrop-blur-[22px]',
          'backdrop-saturate-[160%]',
          'border border-[rgba(200,220,255,0.08)]',
          'shadow-glass-dark',
          'before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none'
        ],
        !glass && 'bg-dark-800 border border-dark-700',
        glow && 'animate-glow hover:animate-glow-hover',
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={clsx('px-8 py-6 border-b border-dark-700/50 relative', className)}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={clsx('px-8 py-6 relative', className)}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={clsx('px-8 py-6 border-t border-dark-700/50 relative', className)}>
      {children}
    </div>
  );
};