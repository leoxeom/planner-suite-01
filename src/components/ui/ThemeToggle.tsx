import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useThemeStore();

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="relative p-2.5 rounded-xl bg-dark-800/25 dark:bg-dark-800/50 backdrop-blur-lg backdrop-saturate-150 border border-white/10 text-dark-800 dark:text-white transition-all duration-300 hover:bg-dark-700/30 dark:hover:bg-dark-700/70"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: isDarkMode ? 180 : 0,
          scale: isDarkMode ? 0.8 : 1,
        }}
        transition={{ 
          duration: 0.5, 
          type: "spring", 
          stiffness: 100,
        }}
        className="relative"
      >
        {isDarkMode ? (
          <Moon 
            size={22} 
            className="text-primary-400 animate-pulse-subtle" 
          />
        ) : (
          <Sun 
            size={22} 
            className="text-primary-600 animate-pulse-subtle" 
          />
        )}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary-500/20"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0, 0.5, 0],
          }}
          transition={{ 
            duration: 1,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        />
      </motion.div>
    </motion.button>
  );
};