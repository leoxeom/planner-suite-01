import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { EventResponseForm } from '../../components/intermittent/EventResponseForm';
import { ReplacementRequestWithSuggestions } from '../../components/intermittent/ReplacementRequestWithSuggestions';

interface EventDetails {
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
  groupe: 'artistes' | 'techniques';
}

interface InfoField {
  id: string;
  type_champ: string;
  contenu_texte: string | null;
  chemin_fichier_supabase_storage: string | null;
}

interface Assignment {
  id: string;
  statut_disponibilite: string;
  event_id: string;
}

interface ReplacementRequest {
  id: string;
  status: string;
  request_type: string;
  comment: string | null;
  created_at: string;
}

interface EventResponse {
  id: string;
  response_type: 'accept' | 'refuse' | 'propose_alternative';
  response_date: string;
  comment: string | null;
  alternative_dates: string[] | null;
}

export const IntermittentEventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuthStore();
  
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [infoFields, setInfoFields] = useState<InfoField[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [replacementRequest, setReplacementRequest] = useState<ReplacementRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États pour la gestion des réponses
  const [isResponseFormOpen, setIsResponseFormOpen] = useState(false);
  const [responseHistory, setResponseHistory] = useState<EventResponse[]>([]);

  useEffect(() => {
    if (eventId && user) {
      fetchEventData();
    }
  }, [eventId, user]);

  const fetchEventData = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les détails de l'événement
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEventDetails(event);

      // Récupérer le profil de l'intermittent
      const { data: profile, error: profileError } = await supabase
        .from('intermittent_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (profileError) throw profileError;

      // Récupérer l'assignation
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('event_intermittent_assignments')
        .select('*')
        .eq('event_id', eventId)
        .eq('intermittent_profile_id', profile.id)
        .single();

      if (assignmentError) throw assignmentError;
      setAssignment(assignmentData);

      // Récupérer les items de planning avec le groupe
      const { data: planning, error: planningError } = await supabase
        .from('event_planning_items')
        .select('id, heure, intitule, ordre, groupe')
        .eq('event_id', eventId)
        .order('ordre', { ascending: true });

      if (planningError) throw planningError;
      setPlanningItems(planning || []);

      // Récupérer les champs d'information
      const { data: info, error: infoError } = await supabase
        .from('event_information_fields')
        .select('*')
        .eq('event_id', eventId);

      if (infoError) throw infoError;
      setInfoFields(info || []);

      // Récupérer la demande de remplacement si elle existe
      const { data: replacement, error: replacementError } = await supabase
        .from('replacement_requests')
        .select('*')
        .eq('event_assignment_id', assignmentData.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (replacementError) throw replacementError;
      if (replacement && replacement.length > 0) {
        setReplacementRequest(replacement[0]);
      }

      // Récupérer l'historique des réponses
      const { data: responses, error: responsesError } = await supabase
        .from('event_intermittent_responses')
        .select('*')
        .eq('event_assignment_id', assignmentData.id)
        .order('response_date', { ascending: false });

      if (responsesError) throw responsesError;
      setResponseHistory(responses || []);

    } catch (error) {
      console.error('Error fetching event data:', error);
      toast.error('Erreur lors du chargement des données de l\'événement');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP à HH:mm', { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  // Fonction pour filtrer les items de planning selon le groupe de l'intermittent
  const getRelevantPlanningItems = () => {
    // Si l'intermittent est un artiste, on affiche les items pour artistes
    // Sinon, on affiche les items techniques
    // Cette logique peut être adaptée selon votre modèle de données
    const isArtist = false; // À adapter selon votre logique métier
    
    if (isArtist) {
      return planningItems.filter(item => item.groupe === 'artistes');
    } else {
      return planningItems.filter(item => item.groupe === 'techniques');
    }
  };

  // Fonction pour traduire le statut de disponibilité
  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'propose': 'Proposé',
      'disponible': 'Disponible',
      'incertain': 'Incertain',
      'non_disponible': 'Non disponible',
      'valide': 'Validé',
      'non_retenu': 'Non retenu',
      'en_attente': 'En attente de réponse'
    };
    return statusMap[status] || status;
  };

  // Fonction pour traduire le type de réponse
  const translateResponseType = (type: string) => {
    const typeMap: Record<string, string> = {
      'accept': 'Accepté',
      'refuse': 'Refusé',
      'propose_alternative': 'Proposé des dates alternatives'
    };
    return typeMap[type] || type;
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

  if (isLoading || !eventDetails || !assignment) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Regrouper les champs d'information par type
  const groupedInfoFields: Record<string, InfoField[]> = {};
  infoFields.forEach(field => {
    if (!groupedInfoFields[field.type_champ]) {
      groupedInfoFields[field.type_champ] = [];
    }
    groupedInfoFields[field.type_champ].push(field);
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{eventDetails.nom_evenement}</h1>
        <div className="flex gap-2">
          {/* Bouton de réponse à la proposition - visible uniquement si statut "propose" */}
          {assignment.statut_disponibilite === 'propose' && (
            <Button
              variant="primary"
              onClick={() => setIsResponseFormOpen(true)}
            >
              <MessageSquare size={18} className="mr-2" />
              Répondre à la proposition
            </Button>
          )}
        </div>
      </div>

      {/* Détails de l'événement */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Détails de l'événement</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Dates</p>
                <p>Du {formatDate(eventDetails.date_debut)}</p>
                <p>Au {formatDate(eventDetails.date_fin)}</p>
              </div>
              {eventDetails.lieu && (
                <div>
                  <p className="text-sm text-gray-400">Lieu</p>
                  <p>{eventDetails.lieu}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Votre statut</p>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  assignment.statut_disponibilite === 'valide' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : assignment.statut_disponibilite === 'non_disponible' || assignment.statut_disponibilite === 'non_retenu'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {translateStatus(assignment.statut_disponibilite)}
                </div>
              </div>
            </div>
          </div>

          {/* Demande de remplacement */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Demande de remplacement</h2>
              {assignment.statut_disponibilite === 'valide' && !replacementRequest && (
                <Button
                  variant="outline"
                  onClick={() => setIsRequestModalOpen(true)}
                >
                  Demander un remplacement
                </Button>
              )}
            </div>

            {replacementRequest ? (
              <div className={`p-4 rounded-lg border ${
                replacementRequest.status === 'pending_approval'
                  ? 'bg-yellow-900/20 border-yellow-500/30'
                  : replacementRequest.status === 'approved_awaiting_replacement' || replacementRequest.status === 'approved_replacement_found'
                  ? 'bg-green-900/20 border-green-500/30'
                  : 'bg-red-900/20 border-red-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {replacementRequest.status === 'pending_approval' ? (
                    <Clock size={18} className="text-yellow-400" />
                  ) : replacementRequest.status === 'approved_awaiting_replacement' || replacementRequest.status === 'approved_replacement_found' ? (
                    <CheckCircle size={18} className="text-green-400" />
                  ) : (
                    <X size={18} className="text-red-400" />
                  )}
                  <span className="font-medium">
                    {translateRequestStatus(replacementRequest.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  Type: {replacementRequest.request_type === 'urgent' ? 'Urgence' : 'Souhait de remplacement'}
                </p>
                {replacementRequest.comment && (
                  <p className="text-sm border-t border-white/10 pt-2 mt-2">
                    {replacementRequest.comment}
                  </p>
                )}
              </div>
            ) : assignment.statut_disponibilite === 'valide' ? (
              <p className="text-gray-400 italic">
                Vous pouvez demander un remplacement si vous n'êtes plus disponible.
              </p>
            ) : (
              <p className="text-gray-400 italic">
                Les demandes de remplacement sont disponibles uniquement pour les événements validés.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Historique des réponses */}
      {responseHistory.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Historique de vos réponses</h2>
          <div className="space-y-4">
            {responseHistory.map((response) => (
              <div key={response.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between items-start">
                  <div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${
                      response.response_type === 'accept' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : response.response_type === 'refuse'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {translateResponseType(response.response_type)}
                    </div>
                    <p className="text-sm text-gray-400">
                      {formatDate(response.response_date)}
                    </p>
                  </div>
                </div>
                
                {response.comment && (
                  <div className="mt-2 p-3 bg-white/5 rounded-lg">
                    <p className="text-sm">{response.comment}</p>
                  </div>
                )}
                
                {response.alternative_dates && response.alternative_dates.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Dates alternatives proposées :</p>
                    <div className="space-y-1">
                      {response.alternative_dates.map((date, index) => (
                        <p key={index} className="text-sm bg-blue-900/10 p-2 rounded">
                          {formatDate(date)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planning de la journée (Feuille de route) */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Planning de la journée</h2>
        {planningItems.length === 0 ? (
          <p className="text-gray-400 italic">Aucun planning défini</p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {getRelevantPlanningItems().map((item) => (
              <div 
                key={item.id}
                className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="w-16 font-medium">{item.heure}</div>
                <div className="flex-grow">
                  <p>{item.intitule}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informations techniques */}
      {Object.keys(groupedInfoFields).length > 0 && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Informations techniques</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedInfoFields).map(([type, fields]) => (
              <div key={type} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="font-medium capitalize mb-3">
                  {type === 'general' ? 'Général' : type}
                </h3>
                <div className="space-y-4">
                  {fields.map(field => (
                    <div key={field.id}>
                      {field.contenu_texte && (
                        <div className="text-sm whitespace-pre-wrap">
                          {field.contenu_texte}
                        </div>
                      )}
                      {field.chemin_fichier_supabase_storage && (
                        <a
                          href={field.chemin_fichier_supabase_storage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm flex items-center gap-1 mt-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                          Fichier lié
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modale de formulaire de réponse */}
      <AnimatePresence>
        {isResponseFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsResponseFormOpen(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <EventResponseForm
                eventId={eventId || ''}
                assignmentId={assignment.id}
                eventName={eventDetails.nom_evenement}
                eventDate={eventDetails.date_debut}
                onResponseSubmitted={() => {
                  setIsResponseFormOpen(false);
                  fetchEventData(); // Rafraîchir les données après la soumission
                }}
                onCancel={() => setIsResponseFormOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nouvelle modale de demande de remplacement avec suggestions */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsRequestModalOpen(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <ReplacementRequestWithSuggestions
                eventId={eventId || ''}
                assignmentId={assignment.id}
                eventName={eventDetails.nom_evenement}
                eventDate={eventDetails.date_debut}
                onRequestSubmitted={() => {
                  setIsRequestModalOpen(false);
                  fetchEventData(); // Rafraîchir les données après la soumission
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
