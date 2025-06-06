import React from 'react';
import { motion } from 'framer-motion';

interface HelpTooltipProps {
  children: React.ReactNode;
  text: string;
  isEnabled?: boolean;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ 
  children, 
  text, 
  isEnabled = false 
}) => {
  if (!isEnabled) return <>{children}</>;

  return (
    <div className="group relative">
      {children}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-dark-700 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50"
      >
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-dark-700" />
      </motion.div>
    </div>
  );
};