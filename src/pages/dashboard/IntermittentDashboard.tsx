import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '../../components/dashboard/Calendar';
import { useAuthStore } from '../../store/authStore';
import { ProfileCompletionForm } from '../../components/intermittent/ProfileCompletionForm';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Bell, Calendar as CalendarIcon, CheckCircle, Clock, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from '../../components/dashboard/NotificationBell';
import { ReplacementRequestWithSuggestions } from '../../components/intermittent/ReplacementRequestWithSuggestions';
import { Button } from '../../components/ui/Button';

interface Event {
  id: string;
  nom_evenement: string;
  date_debut: string;
  date_fin: string;
  lieu: string | null;
  statut_evenement: string;
  statut_disponibilite?: string;
  assignment_id?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  className?: string;
}

interface AssignmentStats {
  proposed: number;
  accepted: number;
  completed: number;
}

interface ReplacementRequest {
  id: string;
  event_id: string;
  event_assignment_id: string;
  status: string;
  request_type: string;
  created_at: string;
}

export const IntermittentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<{
    id: string;
    nom: string;
    prenom: string;
    email: string;
    specialite: string | null;
    profil_complete: boolean;
  } | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<AssignmentStats>({
    proposed: 0,
    accepted: 0,
    completed: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [replacementRequests, setReplacementRequests] = useState<ReplacementRequest[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('intermittent_profiles')
        .select('id, nom, prenom, email, specialite, profil_complete')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      setProfile(data);

      if (data.profil_complete) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erreur lors du chargement du profil');
    }
  };

  const fetchEvents = async () => {
    try {
      // Step 1: Get the intermittent's profile ID
      const { data: profileData, error: profileError } = await supabase
        .from('intermittent_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (profileError) throw profileError;

      if (!profileData) {
        console.error('No intermittent profile found');
        return;
      }

      console.log('Intermittent Profile ID:', profileData.id);

      // Step 2: Get assignments for this intermittent
      const { data: assignments, error: assignmentsError } = await supabase
        .from('event_intermittent_assignments')
        .select('id, event_id, statut_disponibilite')
        .eq('intermittent_profile_id', profileData.id);

      if (assignmentsError) throw assignmentsError;

      console.log('Raw Assignments:', assignments);

      if (!assignments || assignments.length === 0) {
        setEvents([]);
        setStats({
          proposed: 0,
          accepted: 0,
          completed: 0
        });
        return;
      }

      // Step 3: Get events for these assignments
      const eventIds = assignments.map(a => a.event_id);
      console.log('Event IDs:', eventIds);

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds);

      if (eventsError) throw eventsError;

      console.log('Raw Events:', eventsData);

      // Step 4: Combine events with their assignment status and assignment id
      const processedEvents = eventsData?.map(event => {
        const assignment = assignments.find(a => a.event_id === event.id);
        return {
          ...event,
          statut_disponibilite: assignment?.statut_disponibilite,
          assignment_id: assignment?.id
        };
      }) || [];

      setEvents(processedEvents);

      // Step 5: Update stats
      const newStats = {
        proposed: processedEvents.filter(e => e.statut_disponibilite === 'propose').length,
        accepted: processedEvents.filter(e => e.statut_disponibilite === 'valide').length,
        completed: processedEvents.filter(e => 
          e.statut_disponibilite === 'valide' && 
          new Date(e.date_fin) < new Date()
        ).length
      };

      setStats(newStats);

      // Step 6: Get replacement requests
      const assignmentIds = assignments.map(a => a.id);
      const { data: requests, error: requestsError } = await supabase
        .from('replacement_requests')
        .select('id, event_assignment_id, status, request_type, created_at')
        .in('event_assignment_id', assignmentIds);

      if (requestsError) throw requestsError;

      // Add event_id to each request
      const processedRequests = requests?.map(request => {
        const assignment = assignments.find(a => a.id === request.event_assignment_id);
        return {
          ...request,
          event_id: assignment?.event_id || ''
        };
      }) || [];

      setReplacementRequests(processedRequests);

    } catch (error) {
      console.error('Error in fetchEvents:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/dashboard/intermittent/events/${eventId}`);
  };

  const handleRequestReplacement = (event: Event) => {
    setSelectedEvent(event);
    setIsRequestModalOpen(true);
  };

  // Fonction pour traduire le statut de la demande de remplacement
  const translateRequestStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending_approval': 'En attente de validation',
      'approved_awaiting_replacement': 'Validé, en attente de remplaçant',
      'approved_replacement_found': 'Validé, remplaçant trouvé',
      'rejected_by_regisseur': 'Refusé par le régisseur',
      'cancelled_by_intermittent': 'Annulé'
    };
    return statusMap[status] || status;
  };

  // Fonction pour obtenir l'icône et la couleur en fonction du statut
  const getRequestStatusStyle = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return {
          icon: <Clock size={18} />,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/20',
          borderColor: 'border-yellow-500/30'
        };
      case 'approved_awaiting_replacement':
      case 'approved_replacement_found':
        return {
          icon: <CheckCircle size={18} />,
          color: 'text-green-400',
          bgColor: 'bg-green-900/20',
          borderColor: 'border-green-500/30'
        };
      case 'rejected_by_regisseur':
      case 'cancelled_by_intermittent':
        return {
          icon: <AlertTriangle size={18} />,
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

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile.profil_complete) {
    return (
      <ProfileCompletionForm
        profile={profile}
        onComplete={() => {
          fetchProfile();
        }}
      />
    );
  }

  const calendarEvents: CalendarEvent[] = events.map(event => ({
    id: event.id,
    title: event.nom_evenement,
    start: new Date(event.date_debut),
    end: new Date(event.date_fin),
    className: `bg-${event.statut_disponibilite === 'valide' ? 'green' : event.statut_disponibilite === 'non_disponible' ? 'red' : 'primary'}-500/50 text-white border border-${event.statut_disponibilite === 'valide' ? 'green' : event.statut_disponibilite === 'non_disponible' ? 'red' : 'primary'}-500`
  }));

  // Filtrer les demandes de remplacement actives (en attente ou approuvées)
  const activeReplacementRequests = replacementRequests.filter(
    req => ['pending_approval', 'approved_awaiting_replacement'].includes(req.status)
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tableau de Bord Intermittent</h1>
        <NotificationBell />
      </div>

      {/* Section d'alertes pour les demandes de remplacement */}
      {activeReplacementRequests.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Demandes de remplacement en cours</h2>
          <div className="space-y-3">
            {activeReplacementRequests.map(request => {
              const event = events.find(e => e.id === request.event_id);
              const style = getRequestStatusStyle(request.status);
              
              return (
                <div 
                  key={request.id}
                  className={`p-4 rounded-lg border ${style.borderColor} ${style.bgColor} cursor-pointer hover:bg-white/10 transition-all`}
                  onClick={() => event && navigate(`/dashboard/intermittent/events/${event.id}`)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={style.color}>{style.icon}</span>
                    <span className="font-medium">
                      {translateRequestStatus(request.status)}
                    </span>
                  </div>
                  {event && (
                    <div>
                      <p className="font-medium">{event.nom_evenement}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(event.date_debut).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Calendar events={calendarEvents} onEventClick={handleEventClick} />
        </div>

        {/* Stats and Events */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Statistiques Personnelles</h2>
            <div className="space-y-4">
              <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                <p className="text-sm text-warning-600 dark:text-warning-400">Dates proposées</p>
                <p className="text-2xl font-bold">{stats.proposed}</p>
              </div>
              <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
                <p className="text-sm text-success-600 dark:text-success-400">Dates validées</p>
                <p className="text-2xl font-bold">{stats.accepted}</p>
              </div>
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <p className="text-sm text-primary-600 dark:text-primary-400">Dates complétées</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </div>

          {/* Liste des événements à venir avec bouton de remplacement */}
          {events.length > 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Événements à venir</h2>
              <div className="space-y-3">
                {events
                  .filter(e => new Date(e.date_debut) > new Date())
                  .sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime())
                  .slice(0, 3)
                  .map(event => {
                    const hasActiveRequest = replacementRequests.some(
                      req => req.event_id === event.id && 
                      ['pending_approval', 'approved_awaiting_replacement'].includes(req.status)
                    );
                    
                    return (
                      <div 
                        key={event.id}
                        className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div 
                            className="cursor-pointer flex-grow"
                            onClick={() => navigate(`/dashboard/intermittent/events/${event.id}`)}
                          >
                            <p className="font-medium">{event.nom_evenement}</p>
                            <p className="text-sm text-gray-400">
                              {new Date(event.date_debut).toLocaleDateString('fr-FR', { 
                                day: 'numeric', 
                                month: 'long'
                              })}
                            </p>
                            <div className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium ${
                              event.statut_disponibilite === 'valide' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                : event.statut_disponibilite === 'non_disponible'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}>
                              {event.statut_disponibilite === 'valide' ? 'Validé' : 
                               event.statut_disponibilite === 'non_disponible' ? 'Non disponible' :
                               event.statut_disponibilite === 'disponible' ? 'Disponible' :
                               event.statut_disponibilite === 'incertain' ? 'Incertain' : 'Proposé'}
                            </div>
                          </div>
                          
                          {/* Bouton de demande de remplacement */}
                          {event.statut_disponibilite === 'valide' && !hasActiveRequest && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestReplacement(event);
                              }}
                              className="ml-2 whitespace-nowrap"
                            >
                              <UserPlus size={14} className="mr-1" />
                              Remplacement
                            </Button>
                          )}
                          
                          {/* Indicateur de demande en cours */}
                          {hasActiveRequest && (
                            <div className="ml-2 p-1 rounded-full bg-yellow-900/20 border border-yellow-500/30">
                              <Clock size={16} className="text-yellow-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                
                {events.filter(e => new Date(e.date_debut) > new Date()).length > 3 && (
                  <button
                    onClick={() => navigate('/dashboard/intermittent/calendar')}
                    className="w-full text-center text-sm text-primary hover:text-primary-600 transition-colors py-2"
                  >
                    Voir tous les événements
                  </button>
                )}
              </div>
            </div>
          )}

          {!isLoading && events.length === 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
              <p className="text-center text-gray-500 dark:text-gray-400">
                Aucun événement proposé pour le moment
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modale de demande de remplacement */}
      <AnimatePresence>
        {isRequestModalOpen && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsRequestModalOpen(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <ReplacementRequestWithSuggestions
                eventId={selectedEvent.id}
                assignmentId={selectedEvent.assignment_id || ''}
                eventName={selectedEvent.nom_evenement}
                eventDate={selectedEvent.date_debut}
                onRequestSubmitted={() => {
                  setIsRequestModalOpen(false);
                  fetchEvents(); // Rafraîchir les données après la soumission
                  toast.success('Demande de remplacement envoyée');
                }}
                onCancel={() => setIsRequestModalOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
