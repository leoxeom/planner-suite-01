import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Calendar } from '../../components/dashboard/Calendar';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Event {
  id: string;
  nom_evenement: string;
  date_debut: string;
  date_fin: string;
  lieu: string | null;
  statut_evenement: 'brouillon' | 'publie' | 'complet' | 'annule';
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  className?: string;
}

export const RegisseurCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('regisseur_id', user!.id)
        .order('date_debut', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/dashboard/events/${eventId}`);
  };

  const getEventClassName = (status: Event['statut_evenement']) => {
    switch (status) {
      case 'brouillon':
        return 'event-draft';
      case 'publie':
        return 'event-published';
      case 'complet':
        return 'event-complete';
      case 'annule':
        return 'event-canceled';
      default:
        return '';
    }
  };

  const calendarEvents: CalendarEvent[] = events.map(event => ({
    id: event.id,
    title: event.nom_evenement,
    start: new Date(event.date_debut),
    end: new Date(event.date_fin),
    className: getEventClassName(event.statut_evenement)
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-4xl font-display tracking-wider bg-gradient-to-r from-white to-dark-200 dark:from-white dark:to-dark-400 bg-clip-text text-transparent animate-glow-text">
            CALENDRIER
          </h1>
          <p className="text-dark-400 font-heading">
            Vue d'ensemble de vos événements
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Button
            onClick={() => navigate('/dashboard/events/create')}
            leftIcon={<Plus className="w-5 h-5" />}
            theme="stage"
            glow
          >
            NOUVEL ÉVÉNEMENT
          </Button>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-[600px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-[calc(100vh-12rem)]"
        >
          <Calendar 
            events={calendarEvents} 
            onEventClick={handleEventClick}
          />
        </motion.div>
      )}
    </div>
  );
};