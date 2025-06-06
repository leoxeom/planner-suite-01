import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock, Check, X, UserMinus, AlertCircle, UserX } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

interface Event {
  id: string;
  nom_evenement: string;
  date_debut: string;
  date_fin: string;
  lieu: string | null;
  statut_evenement: string;
}

interface PlanningItem {
  id: string;
  heure: string;
  intitule: string;
  ordre: number;
}

interface InfoField {
  type_champ: string;
  contenu_texte: string | null;
  chemin_fichier_supabase_storage: string | null;
}

interface ReplacementRequest {
  id: string;
  status: string;
  request_type: string;
  created_at: string;
}

export const IntermittentEventDetails: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [infoFields, setInfoFields] = useState<InfoField[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [availableIntermittents, setAvailableIntermittents] = useState<any[]>([]);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [replacementRequest, setReplacementRequest] = useState<ReplacementRequest | null>(null);

  const fetchEventDetails = async () => {
    console.log('Fetching details for event ID:', eventId);
    setIsLoading(true);

    try {
      // Get intermittent profile
      const { data: profileData, error: profileError } = await supabase
        .from('intermittent_profiles')
        .select('id, specialite')
        .eq('user_id', user!.id)
        .single();

      if (profileError) throw profileError;
      console.log('Fetched profile:', profileData);
      setProfile(profileData);

      // Get assignment status and replacement request if any
      if (profileData) {
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('event_intermittent_assignments')
          .select(`
            id, 
            statut_disponibilite, 
            date_reponse,
            replacement_requests (
              id,
              status,
              request_type,
              created_at
            )
          `)
          .eq('event_id', eventId)
          .eq('intermittent_profile_id', profileData.id)
          .single();

        if (assignmentError) throw assignmentError;
        console.log('Fetched assignment:', assignmentData);
        
        // Get event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;
        console.log('Fetched event:', eventData);
        setEvent(eventData);

        // Get planning items
        const { data: planningData, error: planningError } = await supabase
          .from('event_planning_items')
          .select('*')
          .eq('event_id', eventId)
          .order('ordre', { ascending: true });

        if (planningError) throw planningError;
        console.log('Fetched planning:', planningData);
        setPlanningItems(planningData || []);

        // Get information fields
        const { data: infoData, error: infoError } = await supabase
          .from('event_information_fields')
          .select('*')
          .eq('event_id', eventId);

        if (infoError) throw infoError;
        console.log('Fetched info fields:', infoData);
        setInfoFields(infoData || []);
        
        if (eventData && assignmentData) {
          setAssignment({
            ...assignmentData,
            replacement_request: assignmentData.replacement_requests?.[0]
          });
          
          // Fetch available intermittents with same speciality
          const { data: intermittentsData } = await supabase
            .from('intermittent_profiles')
            .select('id, nom, prenom, specialite')
            .eq('specialite', profileData.specialite)
            .neq('id', profileData.id);
            
          if (intermittentsData) {
            setAvailableIntermittents(intermittentsData);
          }
        }
      }

    } catch (error) {
      console.error('Error fetching intermittent profile:', error);
      toast.error('Erreur lors du chargement des détails de l\'événement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && eventId) {
      fetchEventDetails();
    }
  }, [user, eventId]);

  const canRequestReplacement = () => {
    return (
      assignment?.statut_disponibilite === 'valide' &&
      (!replacementRequest || 
       ['rejected_by_regisseur', 'cancelled_by_intermittent'].includes(replacementRequest.status))
    );
  };

  const getReplacementRequestStatus = () => {
    if (!replacementRequest) return null;
    
    switch (replacementRequest.status) {
      case 'pending_approval':
        return 'En attente de validation';
      case 'approved_awaiting_replacement':
        return 'Approuvé - En attente de remplaçant';
      case 'approved_replacement_found':
        return 'Remplaçant trouvé';
      case 'rejected_by_regisseur':
        return 'Refusé par le régisseur';
      case 'cancelled_by_intermittent':
        return 'Annulé';
      default:
        return replacementRequest.status;
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          leftIcon={<ArrowLeft size={20} />}
        >
          Retour
        </Button>
        {event && (
          <h1 className="text-3xl font-bold">
            {event.nom_evenement}
          </h1>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : event ? (
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card glass>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Informations Générales</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date de début</p>
                  <p>{new Date(event.date_debut).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date de fin</p>
                  <p>{new Date(event.date_fin).toLocaleDateString('fr-FR')}</p>
                </div>
                {event.lieu && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Lieu</p>
                    <p>{event.lieu}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Votre Statut</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {assignment?.statut_disponibilite === 'valide' ? (
                      <Check size={18} className="text-success-500" />
                    ) : (
                      <AlertCircle size={18} className="text-warning-500" />
                    )}
                    <span className="font-medium">
                      {assignment?.statut_disponibilite === 'valide' ? 'Validé' : 'En attente'}
                    </span>
                  </div>
                </div>
              </div>

              {canRequestReplacement() && (
                <div className="mt-6">
                  <Button
                    onClick={() => setShowReplacementModal(true)}
                    leftIcon={<UserX size={18} />}
                    className="w-full"
                    variant="outline"
                  >
                    Demander un Remplacement
                  </Button>
                </div>
              )}

              {replacementRequest && (
                <div className="mt-4 p-4 bg-dark-900/50 rounded-lg">
                  <p className="text-sm text-gray-400">Statut de votre demande de remplacement :</p>
                  <p className="font-medium mt-1">{getReplacementRequestStatus()}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Demandé le {new Date(replacementRequest.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Planning */}
          {planningItems.length > 0 && (
            <Card glass>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Planning de la Journée</h2>
                <div className="space-y-3">
                  {planningItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center space-x-4 p-3 bg-dark-900/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Clock className="text-primary-400" />
                        <div className="w-20 font-mono text-primary-400">
                          {formatTime(item.heure)}
                        </div>
                      </div>
                      <div className="flex-1">
                        {item.intitule}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Information Fields */}
          {infoFields.length > 0 && (
            <Card glass>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Informations Techniques</h2>
                <div className="space-y-6">
                  {infoFields.map((field) => {
                    if (!field.contenu_texte && !field.chemin_fichier_supabase_storage) return null;
                    return (
                      <div key={field.type_champ} className="space-y-2">
                        <h3 className="text-lg font-medium capitalize">
                          {field.type_champ === 'general' ? 'Informations Générales' : `Informations ${field.type_champ}`}
                        </h3>
                        {field.contenu_texte && (
                          <pre className="whitespace-pre-wrap font-sans text-sm bg-dark-900/50 p-4 rounded-lg">
                            {field.contenu_texte}
                          </pre>
                        )}
                        {field.chemin_fichier_supabase_storage && (
                          <a
                            href={field.chemin_fichier_supabase_storage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 text-primary-400 hover:text-primary-300"
                          >
                            Accéder aux documents
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Événement non trouvé ou vous n'avez pas accès à cet événement
          </p>
        </div>
      )}
    </div>
  );
};

export default IntermittentEventDetails;