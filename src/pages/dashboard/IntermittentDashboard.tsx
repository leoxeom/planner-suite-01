import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '../../components/dashboard/Calendar';
import { useAuthStore } from '../../store/authStore';
import { ProfileCompletionForm } from '../../components/intermittent/ProfileCompletionForm';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Event {
  id: string;
  nom_evenement: string;
  date_debut: string;
  date_fin: string;
  lieu: string | null;
  statut_evenement: string;
  statut_disponibilite?: string;
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
        .select('event_id, statut_disponibilite')
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

      // Step 4: Combine events with their assignment status
      const processedEvents = eventsData?.map(event => ({
        ...event,
        statut_disponibilite: assignments.find(a => a.event_id === event.id)?.statut_disponibilite
      })) || [];

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
    className: 'bg-primary-500/50 text-white border border-primary-500'
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tableau de Bord Intermittent</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Calendar events={calendarEvents} onEventClick={handleEventClick} />
        </div>

        {/* Stats */}
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

          {!isLoading && events.length === 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
              <p className="text-center text-gray-500 dark:text-gray-400">
                Aucun événement proposé pour le moment
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};