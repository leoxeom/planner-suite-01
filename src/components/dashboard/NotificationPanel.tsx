import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { 
  Bell, 
  X, 
  Check, 
  UserPlus, 
  Calendar, 
  AlertTriangle, 
  Users, 
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  type: 'replacement_request' | 'event_update' | 'event_cancelled' | 'team_validated' | 'request_approved' | 'request_rejected';
  content: string;
  is_read: boolean;
  created_at: string;
  related_event_id: string | null;
  related_request_id: string | null;
}

// Fonction pour formater la date relative
const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  } catch (e) {
    return 'Date inconnue';
  }
};

// Fonction pour obtenir l'icône et la couleur en fonction du type de notification
const getNotificationStyle = (type: Notification['type']) => {
  switch (type) {
    case 'replacement_request':
      return {
        icon: <UserPlus size={18} />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/20',
        borderColor: 'border-blue-500/30'
      };
    case 'event_update':
      return {
        icon: <RefreshCw size={18} />,
        color: 'text-purple-400',
        bgColor: 'bg-purple-900/20',
        borderColor: 'border-purple-500/30'
      };
    case 'event_cancelled':
      return {
        icon: <XCircle size={18} />,
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-500/30'
      };
    case 'team_validated':
      return {
        icon: <Users size={18} />,
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        borderColor: 'border-green-500/30'
      };
    case 'request_approved':
      return {
        icon: <CheckCircle size={18} />,
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        borderColor: 'border-green-500/30'
      };
    case 'request_rejected':
      return {
        icon: <XCircle size={18} />,
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-500/30'
      };
    default:
      return {
        icon: <Bell size={18} />,
        color: 'text-gray-400',
        bgColor: 'bg-gray-900/20',
        borderColor: 'border-gray-500/30'
      };
  }
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  // Gestionnaire de clic en dehors du panneau pour le fermer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) && isOpen) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Erreur lors du marquage des notifications');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marquer comme lu
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Naviguer vers la page appropriée
    if (notification.related_event_id) {
      navigate(`/dashboard/regisseur/events/${notification.related_event_id}`);
      onClose();
    } else if (notification.related_request_id) {
      // Naviguer vers la page de demande de remplacement (à adapter selon votre structure)
      navigate(`/dashboard/regisseur/replacement-requests/${notification.related_request_id}`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 pointer-events-none"
        >
          <motion.div
            ref={panelRef}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl w-full max-w-md h-[85vh] overflow-hidden pointer-events-auto"
          >
            {/* En-tête du panneau */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-primary" />
                <h2 className="text-lg font-semibold">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-primary hover:text-primary-600 transition-colors"
                  >
                    Tout marquer comme lu
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            {/* Corps du panneau avec les notifications */}
            <div className="overflow-y-auto h-[calc(100%-64px)] p-2">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <Bell size={32} className="mb-2 opacity-50" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((notification) => {
                    const style = getNotificationStyle(notification.type);
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.2 }}
                        className={`mb-2 p-3 rounded-xl border ${style.borderColor} ${notification.is_read ? 'bg-white/5' : `${style.bgColor}`} cursor-pointer transition-all hover:bg-white/10`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${style.bgColor}`}>
                            <span className={style.color}>{style.icon}</span>
                          </div>
                          <div className="flex-grow">
                            <p className="font-medium">{notification.content}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatRelativeTime(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
