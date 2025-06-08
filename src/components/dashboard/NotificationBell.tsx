import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { NotificationPanel } from './NotificationPanel';

export const NotificationBell: React.FC = () => {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  // Charger les notifications non lues au chargement
  useEffect(() => {
    if (user) {
      fetchUnreadNotifications();
      subscribeToNotifications();
    }

    return () => {
      // Nettoyer l'abonnement lors du démontage
      if (user) {
        supabase.removeAllChannels();
      }
    };
  }, [user]);

  // Effet pour animer la cloche quand il y a de nouvelles notifications
  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotification(true);
      const timer = setTimeout(() => {
        setHasNewNotification(false);
      }, 3000); // Animation pendant 3 secondes

      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Récupérer le nombre de notifications non lues
  const fetchUnreadNotifications = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  // S'abonner aux nouvelles notifications en temps réel
  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notification_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user!.id}`,
        },
        (payload) => {
          // Incrémenter le compteur quand une nouvelle notification arrive
          setUnreadCount((prev) => prev + 1);
          // Déclencher l'animation
          setHasNewNotification(true);
          setTimeout(() => setHasNewNotification(false), 3000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user!.id} AND is_read=eq.true`,
        },
        (payload) => {
          // Mettre à jour le compteur quand une notification est marquée comme lue
          fetchUnreadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Animation pour la cloche
  const bellAnimation = hasNewNotification
    ? {
        rotate: [0, 15, -15, 10, -10, 5, -5, 0],
        transition: {
          duration: 0.8,
          ease: "easeInOut",
          times: [0, 0.1, 0.3, 0.5, 0.6, 0.7, 0.8, 1],
          repeat: 1,
        },
      }
    : {};

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="relative p-2.5 rounded-xl bg-dark-800/25 dark:bg-dark-800/50 backdrop-blur-lg backdrop-saturate-150 border border-white/10 text-dark-800 dark:text-white transition-all duration-300 hover:bg-dark-700/30 dark:hover:bg-dark-700/70"
        aria-label="Notifications"
        animate={bellAnimation}
      >
        <motion.div className="relative">
          <Bell size={22} className="text-primary-400" />
          
          {/* Badge pour le nombre de notifications non lues */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center"
                style={{ 
                  minWidth: '18px', 
                  height: '18px',
                  padding: unreadCount > 9 ? '0 4px' : '0'
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Effet de pulsation */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary-500/20"
            animate={{ 
              scale: hasNewNotification ? [1, 1.5, 1] : [1, 1.2, 1],
              opacity: hasNewNotification ? [0, 0.7, 0] : [0, 0.5, 0],
            }}
            transition={{ 
              duration: hasNewNotification ? 0.8 : 1,
              repeat: hasNewNotification ? 3 : Infinity,
              repeatDelay: hasNewNotification ? 0.2 : 2,
            }}
          />
        </motion.div>
      </motion.button>
      
      {/* Panneau de notifications */}
      <NotificationPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
      />
    </>
  );
};
