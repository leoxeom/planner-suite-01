import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-dark-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center"
      >
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
          <div className="absolute inset-1 border-r-2 border-primary-300 rounded-full animate-spin animation-delay-150"></div>
          <div className="absolute inset-2 border-b-2 border-primary-600 rounded-full animate-spin animation-delay-300"></div>
        </div>
        
        {message && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-center text-white/80 max-w-xs"
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};
