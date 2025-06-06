import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, children }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => clsx(
        'flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 group relative overflow-hidden',
        isActive ? [
          'text-primary-light dark:text-primary-DEFAULT',
          'bg-primary-light/5 dark:bg-primary-DEFAULT/5',
          'shadow-neon-light dark:shadow-neon-dark',
        ] : [
          'text-dark-400',
          'hover:text-primary-light dark:hover:text-primary-DEFAULT',
          'hover:bg-primary-light/5 dark:hover:bg-primary-DEFAULT/5',
        ]
      )}
    >
      {({ isActive }) => (
        <>
          <motion.div
            animate={{ 
              scale: isActive ? 1.1 : 1,
              rotate: isActive ? 360 : 0 
            }}
            whileHover={{ scale: 1.1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20 
            }}
            className={clsx(
              'transition-colors duration-300',
              'group-hover:text-primary-light dark:group-hover:text-primary-DEFAULT'
            )}
          >
            {icon}
          </motion.div>
          <span className="font-heading font-medium relative z-10">{children}</span>
          <motion.div
            initial={false}
            animate={{
              width: isActive ? '100%' : '0%',
              opacity: isActive ? 1 : 0
            }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-r from-primary-light/5 to-transparent dark:from-primary-DEFAULT/5 -z-1"
          />
        </>
      )}
    </NavLink>
  );
};