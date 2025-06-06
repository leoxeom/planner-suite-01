import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Building2,
  Settings
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => clsx(
        'flex flex-col items-center justify-center px-4 py-3',
        'transition-all duration-300 relative group'
      )}
    >
      {({ isActive }) => (
        <>
          <motion.div
            animate={{ 
              scale: isActive ? 1.1 : 1,
              y: isActive ? -2 : 0
            }}
            className={clsx(
              'relative z-10 transition-colors duration-300',
              isActive 
                ? 'text-primary dark:text-primary-400' 
                : 'text-dark-400 group-hover:text-primary/70 dark:group-hover:text-primary-400/70'
            )}
          >
            {icon}
          </motion.div>
          
          <span className={clsx(
            'text-xs mt-1 font-medium transition-colors duration-300',
            isActive 
              ? 'text-primary dark:text-primary-400' 
              : 'text-dark-400 group-hover:text-primary/70 dark:group-hover:text-primary-400/70'
          )}>
            {label}
          </span>

          {isActive && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-primary/5 dark:bg-primary-400/10 rounded-xl"
              initial={false}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
};

export const BottomNav: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 mb-6 px-1 py-1 rounded-2xl glass z-50 w-[calc(100%-2rem)] max-w-2xl">
      <div className="flex justify-around items-center">
        <NavItem 
          to="/dashboard" 
          icon={<LayoutDashboard size={24} />} 
          label="Tableau"
        />
        {user?.role === 'regisseur' ? (
          <>
            <NavItem 
              to="/dashboard/calendar" 
              icon={<Calendar size={24} />} 
              label="Événements"
            />
            <NavItem 
              to="/dashboard/intermittents" 
              icon={<Users size={24} />} 
              label="Équipe"
            />
            <NavItem 
              to="/dashboard/messages" 
              icon={<MessageSquare size={24} />} 
              label="Messages"
            />
            <NavItem 
              to="/dashboard/settings" 
              icon={<Settings size={24} />} 
              label="Réglages"
            />
          </>
        ) : (
          <>
            <NavItem 
              to="/dashboard/calendar" 
              icon={<Calendar size={24} />} 
              label="Événements"
            />
            <NavItem 
              to="/dashboard/venue" 
              icon={<Building2 size={24} />} 
              label="Le Lieu"
            />
            <NavItem 
              to="/dashboard/settings" 
              icon={<Settings size={24} />} 
              label="Réglages"
            />
          </>
        )}
      </div>
    </nav>
  );
};