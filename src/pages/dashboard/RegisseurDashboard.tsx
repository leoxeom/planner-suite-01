import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Users, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Calendar as BigCalendar } from '../../components/dashboard/Calendar';
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

interface EventStats {
  drafts: number;
  published: number;
  total: number;
  enAttenteReponses: number;
  reponsesCompletes: number;
  terminesEquipeOk: number;
}

export const RegisseurDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats>({
    drafts: 0,
    published: 0,
    total: 0,
    enAttenteReponses: 0,
    reponsesCompletes: 0,
    terminesEquipeOk: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStats, setSelectedStats] = useState<'upcoming' | 'past'>('upcoming');
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchEvents(),
        fetchEventStats()
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [user]);

  const fetchEventStats = async () => {
    try {
      setIsLoadingStats(true);
      
      // Get all events with their assignments for the current regisseur
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          event_intermittent_assignments (
            id,
            statut_disponibilite
          )
        `)
        .eq('regisseur_id', user!.id);

      if (eventsError) throw eventsError;

      if (!events) {
        setStats({
          drafts: 0,
          published: 0,
          total: 0,
          enAttenteReponses: 0,
          reponsesCompletes: 0,
          terminesEquipeOk: 0
        });
        return;
      }
      const currentDate = new Date().toISOString();

      // Calculate stats
      const drafts = events.filter(e => e.statut_evenement === 'brouillon').length;
      const published = events.filter(e => e.statut_evenement === 'publie').length;
      
      // Events with at least one pending response
      const enAttenteReponses = events.filter(e => 
        e.statut_evenement === 'publie' &&
        e.event_intermittent_assignments.some(a => a.statut_disponibilite === 'propose')
      ).length;
      
      // Events where all intermittents have responded
      const reponsesCompletes = events.filter(e =>
        e.statut_evenement === 'publie' &&
        e.event_intermittent_assignments.length > 0 &&
        e.event_intermittent_assignments.every(a => a.statut_disponibilite !== 'propose')
      ).length;
      
      // Completed events with validated team
      const terminesEquipeOk = events.filter(e =>
        e.statut_evenement === 'publie' &&
        e.date_fin < currentDate &&
        e.event_intermittent_assignments.length > 0 &&
        e.event_intermittent_assignments.some(a => a.statut_disponibilite === 'valide') &&
        !e.event_intermittent_assignments.some(a => ['propose', 'non_disponible'].includes(a.statut_disponibilite))
      ).length;

      setStats({
        drafts,
        published,
        total: drafts + published,
        enAttenteReponses,
        reponsesCompletes,
        terminesEquipeOk
      });

    } catch (error) {
      console.error('Error fetching event stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchEvents = async () => {
    try {
      // Fetch all events for this regisseur
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

  const upcomingEvents = events
    .filter(e => new Date(e.date_debut) > new Date())
    .sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime())
    .slice(0, 3);

  const pastEvents = events
    .filter(e => new Date(e.date_fin) < new Date())
    .sort((a, b) => new Date(b.date_fin).getTime() - new Date(a.date_fin).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-4xl font-display tracking-wider bg-gradient-to-r from-white to-dark-200 dark:from-white dark:to-dark-400 bg-clip-text text-transparent animate-glow-text">
            TABLEAU DE BORD
          </h1>
          <p className="text-dark-400 font-heading">
            Gérez vos événements et votre équipe
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-4"
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Calendar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <Card glass glow className="overflow-hidden">
            <CardContent>
              <BigCalendar 
                events={calendarEvents} 
                onEventClick={handleEventClick}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats and Quick Access */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          {/* Stats Cards */}
          <Card glass glow>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <h2 className="text-xl font-display tracking-wider">STATISTIQUES</h2>
                <div className="h-0.5 bg-gradient-to-r from-primary-500/50 to-transparent" />
              </div>
              
              {isLoadingStats ? (
                <div className="col-span-2 flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="bg-dark-800/50 backdrop-blur rounded-lg p-4 border border-white/5">
                    <p className="text-sm text-dark-400 mb-1 font-heading">Brouillons</p>
                    <p className="text-3xl font-display text-primary-400 animate-text-glow-blue">
                      {stats.drafts}
                    </p>
                  </div>
                  
                  <div className="bg-dark-800/50 backdrop-blur rounded-lg p-4 border border-white/5">
                    <p className="text-sm text-dark-400 mb-1 font-heading">Publiés</p>
                    <p className="text-3xl font-display text-secondary-400 animate-text-glow">
                      {stats.published}
                    </p>
                  </div>
                  
                  <div className="bg-dark-800/50 backdrop-blur rounded-lg p-4 border border-white/5">
                    <p className="text-sm text-dark-400 mb-1 font-heading">En Attente de Réponses</p>
                    <p className="text-3xl font-display text-warning-400 animate-text-glow">
                      {stats.enAttenteReponses}
                    </p>
                  </div>
                  
                  <div className="bg-dark-800/50 backdrop-blur rounded-lg p-4 border border-white/5">
                    <p className="text-sm text-dark-400 mb-1 font-heading">Réponses Complètes</p>
                    <p className="text-3xl font-display text-success-400 animate-text-glow">
                      {stats.reponsesCompletes}
                    </p>
                  </div>
                  
                  <div className="col-span-2 bg-dark-800/50 backdrop-blur rounded-lg p-4 border border-white/5">
                    <p className="text-sm text-dark-400 mb-1 font-heading">Terminés (Équipe OK)</p>
                    <p className="text-3xl font-display text-accent-400 animate-text-glow">
                      {stats.terminesEquipeOk}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Events List */}
          <Card glass glow>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display tracking-wider">ÉVÉNEMENTS</h2>
                <div className="flex rounded-lg overflow-hidden border border-white/10">
                  <button
                    onClick={() => setSelectedStats('upcoming')}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      selectedStats === 'upcoming'
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'hover:bg-dark-800/50'
                    }`}
                  >
                    À venir
                  </button>
                  <button
                    onClick={() => setSelectedStats('past')}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      selectedStats === 'past'
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'hover:bg-dark-800/50'
                    }`}
                  >
                    Passés
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {(selectedStats === 'upcoming' ? upcomingEvents : pastEvents).map(event => (
                  <button
                    key={event.id}
                    onClick={() => handleEventClick(event.id)}
                    className="w-full p-3 bg-dark-800/50 backdrop-blur rounded-lg border border-white/5 hover:bg-dark-700/50 transition-colors group text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors">
                          {event.nom_evenement}
                        </h3>
                        <p className="text-sm text-dark-400">
                          {new Date(event.date_debut).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-dark-400 group-hover:text-primary-400 transition-colors" />
                    </div>
                  </button>
                ))}

                {(selectedStats === 'upcoming' ? upcomingEvents : pastEvents).length === 0 && (
                  <p className="text-center text-dark-400 py-4">
                    Aucun événement {selectedStats === 'upcoming' ? 'à venir' : 'passé'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};