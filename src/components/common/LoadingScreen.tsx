import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-dark-950">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="mb-4 flex justify-center"
        >
          <Loader2 size={48} className="text-primary-500" />
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Chargement...
        </h3>
      </motion.div>
    </div>
  );
};