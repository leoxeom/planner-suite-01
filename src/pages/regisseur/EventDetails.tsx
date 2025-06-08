import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Edit, Users, Wrench, Check, X, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { FeuilleDeRouteDownload } from '../../components/events/FeuilleDeRouteDownload';
import { EnhancedCalendar } from '../../components/dashboard/EnhancedCalendar';

// Mise à jour de l'interface pour inclure le groupe
interface PlanningItem {
  id: string;
  heure: string;
  intitule: string;
  ordre: number;
  groupe: 'artistes' | 'techniques';
}

interface EventInfoField {
  id: string;
  type_champ: string;
  contenu_texte: string | null;
  chemin_fichier_supabase_storage: string | null;
}

interface IntermittentAssignment {
  id: string;
  intermittent_profile_id: string;
  statut_disponibilite: string;
  nom: string;
  prenom: string;
  specialite: string | null;
}

// Type pour le statut de sélection des intermittents
type SelectionStatus = 'selected' | 'not_selected' | 'pending';

export const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [eventDetails, setEventDetails] = useState<{
    id: string;
    nom_evenement: string;
    date_debut: string;
    date_fin: string;
    lieu: string | null;
    statut_evenement: string;
  } | null>(null);
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [infoFields, setInfoFields] = useState<EventInfoField[]>([]);
  const [intermittentAssignments, setIntermittentAssignments] = useState<IntermittentAssignment[]>([]);
  
  // Nouveau state pour gérer le statut de sélection de chaque intermittent
  const [intermittentSelectionStatus, setIntermittentSelectionStatus] = useState<Record<string, SelectionStatus>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTeamFinalized, setIsTeamFinalized] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEventDetails(event);

      // Fetch planning items with groupe
      const { data: planning, error: planningError } = await supabase
        .from('event_planning_items')
        .select('id, heure, intitule, ordre, groupe')
        .eq('event_id', eventId)
        .order('ordre', { ascending: true });

      if (planningError) throw planningError;
      setPlanningItems(planning || []);

      // Fetch information fields
      const { data: info, error: infoError } = await supabase
        .from('event_information_fields')
        .select('*')
        .eq('event_id', eventId);

      if (infoError) throw infoError;
      setInfoFields(info || []);

      // Fetch intermittent assignments with profile data
      const { data: assignments, error: assignmentsError } = await supabase
        .from('event_intermittent_assignments')
        .select(`
          id,
          intermittent_profile_id,
          statut_disponibilite,
          intermittent_profiles:intermittent_profile_id (
            nom,
            prenom,
            specialite
          )
        `)
        .eq('event_id', eventId);

      if (assignmentsError) throw assignmentsError;

      if (assignments) {
        const formattedAssignments = assignments.map(assignment => ({
          id: assignment.id,
          intermittent_profile_id: assignment.intermittent_profile_id,
          statut_disponibilite: assignment.statut_disponibilite,
          nom: assignment.intermittent_profiles.nom,
          prenom: assignment.intermittent_profiles.prenom,
          specialite: assignment.intermittent_profiles.specialite,
        }));

        setIntermittentAssignments(formattedAssignments);

        // Check if team is already finalized
        const isFinalized = formattedAssignments.some(a => 
          a.statut_disponibilite === 'valide' || a.statut_disponibilite === 'non_retenu'
        );
        setIsTeamFinalized(isFinalized);

        // Initialize selection status for each intermittent
        const initialSelectionStatus: Record<string, SelectionStatus> = {};
        formattedAssignments.forEach(a => {
          if (a.statut_disponibilite === 'valide') {
            initialSelectionStatus[a.intermittent_profile_id] = 'selected';
          } else if (a.statut_disponibilite === 'non_retenu') {
            initialSelectionStatus[a.intermittent_profile_id] = 'not_selected';
          } else if (a.statut_disponibilite === 'disponible' || a.statut_disponibilite === 'incertain') {
            initialSelectionStatus[a.intermittent_profile_id] = 'pending';
          } else if (a.statut_disponibilite === 'propose') {
            initialSelectionStatus[a.intermittent_profile_id] = 'pending';
          } else {
            initialSelectionStatus[a.intermittent_profile_id] = 'pending';
          }
        });
        setIntermittentSelectionStatus(initialSelectionStatus);
      }

    } catch (error) {
      console.error('Error fetching event data:', error);
      toast.error('Erreur lors du chargement des données de l\'événement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      
      toast.success('Événement supprimé avec succès');
      navigate('/dashboard/regisseur');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Erreur lors de la suppression de l\'événement');
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Fonction pour cycler entre les 3 états de sélection
  const toggleIntermittentSelection = (intermittentProfileId: string) => {
    setIntermittentSelectionStatus(prev => {
      const currentStatus = prev[intermittentProfileId] || 'pending';
      let newStatus: SelectionStatus;
      
      // Cycle entre les états : pending -> selected -> not_selected -> pending
      if (currentStatus === 'pending') {
        newStatus = 'selected';
      } else if (currentStatus === 'selected') {
        newStatus = 'not_selected';
      } else {
        newStatus = 'pending';
      }
      
      return {
        ...prev,
        [intermittentProfileId]: newStatus
      };
    });
  };

  const handleValidateTeam = async () => {
    try {
      setIsLoading(true);
      
      // Préparer les mises à jour pour chaque intermittent selon son statut de sélection
      const updates = [];
      
      for (const assignment of intermittentAssignments) {
        const selectionStatus = intermittentSelectionStatus[assignment.intermittent_profile_id];
        const currentStatus = assignment.statut_disponibilite;
        
        // Ne mettre à jour que si l'intermittent a répondu (disponible, incertain) ou s'il est explicitement marqué comme non retenu
        if (
          // Cas 1: L'intermittent est sélectionné et a répondu (disponible ou incertain)
          (selectionStatus === 'selected' && (currentStatus === 'disponible' || currentStatus === 'incertain')) ||
          // Cas 2: L'intermittent est explicitement non retenu et a répondu
          (selectionStatus === 'not_selected' && (currentStatus === 'disponible' || currentStatus === 'incertain')) ||
          // Cas 3: L'intermittent est explicitement non retenu et était en attente
          (selectionStatus === 'not_selected' && currentStatus === 'propose')
        ) {
          updates.push({
            id: assignment.id,
            statut_disponibilite: selectionStatus === 'selected' ? 'valide' : 'non_retenu'
          });
        }
        // Les intermittents en 'pending' ou ceux qui n'ont pas encore répondu restent inchangés
      }
      
      // Effectuer les mises à jour en base de données
      if (updates.length > 0) {
        for (const update of updates) {
          const { error } = await supabase
            .from('event_intermittent_assignments')
            .update({ statut_disponibilite: update.statut_disponibilite })
            .eq('id', update.id);
            
          if (error) throw error;
        }
      }
      
      toast.success('Équipe mise à jour avec succès');
      setIsTeamFinalized(true);
      fetchEventData(); // Refresh data
    } catch (error) {
      console.error('Error validating team:', error);
      toast.error('Erreur lors de la validation de l\'équipe');
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

  const handleDuplicateEvent = async (event: any, startDate: Date) => {
    try {
      setIsLoading(true);
      
      // Récupérer toutes les données de l'événement actuel
      const { data: currentEvent, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      
      // Calculer la différence de jours entre la date d'origine et la nouvelle date
      const originalDate = new Date(currentEvent.date_debut);
      const daysDiff = Math.floor((startDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Créer les nouvelles dates en ajoutant la différence
      const newStartDate = new Date(currentEvent.date_debut);
      newStartDate.setDate(newStartDate.getDate() + daysDiff);
      
      const newEndDate = new Date(currentEvent.date_fin);
      newEndDate.setDate(newEndDate.getDate() + daysDiff);
      
      // Créer le nouvel événement
      const { data: newEvent, error: createError } = await supabase
        .from('events')
        .insert({
          ...currentEvent,
          id: undefined, // Laisser Supabase générer un nouvel ID
          date_debut: newStartDate.toISOString(),
          date_fin: newEndDate.toISOString(),
          statut_evenement: 'brouillon', // Commencer comme brouillon
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;
      
      // Récupérer les items de planning actuels
      const { data: planningItems, error: planningError } = await supabase
        .from('event_planning_items')
        .select('*')
        .eq('event_id', eventId);

      if (planningError) throw planningError;
      
      // Dupliquer les items de planning
      if (planningItems && planningItems.length > 0) {
        const newPlanningItems = planningItems.map(item => ({
          ...item,
          id: undefined, // Laisser Supabase générer un nouvel ID
          event_id: newEvent.id
        }));
        
        const { error: insertPlanningError } = await supabase
          .from('event_planning_items')
          .insert(newPlanningItems);
          
        if (insertPlanningError) throw insertPlanningError;
      }
      
      // Récupérer les champs d'information
      const { data: infoFields, error: infoError } = await supabase
        .from('event_information_fields')
        .select('*')
        .eq('event_id', eventId);

      if (infoError) throw infoError;
      
      // Dupliquer les champs d'information
      if (infoFields && infoFields.length > 0) {
        const newInfoFields = infoFields.map(field => ({
          ...field,
          id: undefined, // Laisser Supabase générer un nouvel ID
          event_id: newEvent.id
        }));
        
        const { error: insertInfoError } = await supabase
          .from('event_information_fields')
          .insert(newInfoFields);
          
        if (insertInfoError) throw insertInfoError;
      }
      
      toast.success(`Événement dupliqué pour le ${format(newStartDate, 'PPP', { locale: fr })}`);
      navigate(`/dashboard/regisseur/events/${newEvent.id}/edit`);
      
    } catch (error) {
      console.error('Error duplicating event:', error);
      toast.error('Erreur lors de la duplication de l\'événement');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !eventDetails) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Group info fields by type
  const groupedInfoFields: Record<string, EventInfoField[]> = {};
  infoFields.forEach(field => {
    if (!groupedInfoFields[field.type_champ]) {
      groupedInfoFields[field.type_champ] = [];
    }
    groupedInfoFields[field.type_champ].push(field);
  });

  // Group intermittents by status for better UI organization
  const groupedIntermittents = {
    valide: intermittentAssignments.filter(a => a.statut_disponibilite === 'valide'),
    disponible: intermittentAssignments.filter(a => a.statut_disponibilite === 'disponible'),
    incertain: intermittentAssignments.filter(a => a.statut_disponibilite === 'incertain'),
    non_disponible: intermittentAssignments.filter(a => a.statut_disponibilite === 'non_disponible'),
    non_retenu: intermittentAssignments.filter(a => a.statut_disponibilite === 'non_retenu'),
    propose: intermittentAssignments.filter(a => a.statut_disponibilite === 'propose'),
    en_attente: intermittentAssignments.filter(a => a.statut_disponibilite === 'en_attente'),
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{eventDetails.nom_evenement}</h1>
        <div className="flex gap-2">
          {/* Ajout du bouton de téléchargement de la feuille de route */}
          <FeuilleDeRouteDownload 
            event={eventDetails} 
            planningItems={planningItems} 
          />
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/regisseur/events/${eventId}/edit`)}
          >
            <Edit size={18} className="mr-2" />
            Modifier
          </Button>
          <Button
            variant="danger"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 size={18} className="mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Event details */}
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
                <p className="text-sm text-gray-400">Statut</p>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  eventDetails.statut_evenement === 'publie' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {eventDetails.statut_evenement === 'publie' ? 'Publié' : 'Brouillon'}
                </div>
              </div>
            </div>
          </div>

          {/* Planning de la journée (Feuille de route) */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Feuille de route</h2>
            {planningItems.length === 0 ? (
              <p className="text-gray-400 italic">Aucun planning défini</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {planningItems.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="w-16 font-medium">{item.heure}</div>
                    <div className="flex-grow">
                      <p>{item.intitule}</p>
                    </div>
                    {/* Badge coloré pour indiquer le groupe */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      item.groupe === 'artistes' 
                        ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm shadow-primary/10' 
                        : 'bg-secondary/20 text-secondary border border-secondary/30 shadow-sm shadow-secondary/10'
                    }`}>
                      {item.groupe === 'artistes' ? (
                        <>
                          <Users size={12} />
                          <span>Artistes</span>
                        </>
                      ) : (
                        <>
                          <Wrench size={12} />
                          <span>Techniques</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informations par spécialité */}
      {Object.keys(groupedInfoFields).length > 0 && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Informations par spécialité</h2>
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

      {/* Intermittents */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Intermittents</h2>
        
        {intermittentAssignments.length === 0 ? (
          <p className="text-gray-400 italic">Aucun intermittent assigné à cet événement</p>
        ) : (
          <div className="space-y-6">
            {/* Validated team */}
            {groupedIntermittents.valide.length > 0 && (
              <div>
                <h3 className="font-medium text-green-400 mb-3">Équipe validée</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupedIntermittents.valide.map(assignment => (
                    <div
                      key={assignment.id}
                      className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg"
                    >
                      <p className="font-medium">{assignment.prenom} {assignment.nom}</p>
                      {assignment.specialite && (
                        <p className="text-sm text-gray-400">{assignment.specialite}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Available intermittents with 3-state selection */}
            {(groupedIntermittents.disponible.length > 0 || groupedIntermittents.incertain.length > 0 || groupedIntermittents.propose.length > 0) && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Intermittents disponibles</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <span>Sélectionné</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <span>Non retenu</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      <span>En attente</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Disponible */}
                  {groupedIntermittents.disponible.map(assignment => (
                    <div
                      key={assignment.id}
                      onClick={() => toggleIntermittentSelection(assignment.intermittent_profile_id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between border ${
                        intermittentSelectionStatus[assignment.intermittent_profile_id] === 'selected'
                          ? 'bg-green-900/20 border-green-500/30'
                          : intermittentSelectionStatus[assignment.intermittent_profile_id] === 'not_selected'
                          ? 'bg-red-900/20 border-red-500/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{assignment.prenom} {assignment.nom}</p>
                        <div className="flex items-center gap-2">
                          {assignment.specialite && (
                            <p className="text-sm text-gray-400">{assignment.specialite}</p>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            Disponible
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {intermittentSelectionStatus[assignment.intermittent_profile_id] === 'selected' ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        ) : intermittentSelectionStatus[assignment.intermittent_profile_id] === 'not_selected' ? (
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                            <X size={14} className="text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-500/50 flex items-center justify-center">
                            <Clock size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Incertain */}
                  {groupedIntermittents.incertain.map(assignment => (
                    <div
                      key={assignment.id}
                      onClick={() => toggleIntermittentSelection(assignment.intermittent_profile_id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between border ${
                        intermittentSelectionStatus[assignment.intermittent_profile_id] === 'selected'
                          ? 'bg-green-900/20 border-green-500/30'
                          : intermittentSelectionStatus[assignment.intermittent_profile_id] === 'not_selected'
                          ? 'bg-red-900/20 border-red-500/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{assignment.prenom} {assignment.nom}</p>
                        <div className="flex items-center gap-2">
                          {assignment.specialite && (
                            <p className="text-sm text-gray-400">{assignment.specialite}</p>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                            Incertain
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {intermittentSelectionStatus[assignment.intermittent_profile_id] === 'selected' ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        ) : intermittentSelectionStatus[assignment.intermittent_profile_id] === 'not_selected' ? (
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                            <X size={14} className="text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-500/50 flex items-center justify-center">
                            <Clock size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Proposé (en attente de réponse) */}
                  {groupedIntermittents.propose.map(assignment => (
                    <div
                      key={assignment.id}
                      onClick={() => toggleIntermittentSelection(assignment.intermittent_profile_id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between border ${
                        intermittentSelectionStatus[assignment.intermittent_profile_id] === 'selected'
                          ? 'bg-green-900/20 border-green-500/30'
                          : intermittentSelectionStatus[assignment.intermittent_profile_id] === 'not_selected'
                          ? 'bg-red-900/20 border-red-500/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{assignment.prenom} {assignment.nom}</p>
                        <div className="flex items-center gap-2">
                          {assignment.specialite && (
                            <p className="text-sm text-gray-400">{assignment.specialite}</p>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            En attente de réponse
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {intermittentSelectionStatus[assignment.intermittent_profile_id] === 'selected' ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        ) : intermittentSelectionStatus[assignment.intermittent_profile_id] === 'not_selected' ? (
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                            <X size={14} className="text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-500/50 flex items-center justify-center">
                            <Clock size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleValidateTeam}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>En cours...</span>
                      </div>
                    ) : (
                      <span>Mettre à jour l'équipe</span>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Not available */}
            {groupedIntermittents.non_disponible.length > 0 && (
              <div>
                <h3 className="font-medium text-red-400 mb-3">Non disponibles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupedIntermittents.non_disponible.map(assignment => (
                    <div
                      key={assignment.id}
                      className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
                    >
                      <p className="font-medium">{assignment.prenom} {assignment.nom}</p>
                      {assignment.specialite && (
                        <p className="text-sm text-gray-400">{assignment.specialite}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Not selected */}
            {groupedIntermittents.non_retenu.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-400 mb-3">Non retenus</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupedIntermittents.non_retenu.map(assignment => (
                    <div
                      key={assignment.id}
                      className="p-3 bg-gray-900/20 border border-gray-500/30 rounded-lg"
                    >
                      <p className="font-medium">{assignment.prenom} {assignment.nom}</p>
                      {assignment.specialite && (
                        <p className="text-sm text-gray-400">{assignment.specialite}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Confirmer la suppression</h3>
              <p className="mb-6">
                Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteEvent}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>En cours...</span>
                    </div>
                  ) : (
                    <span>Supprimer</span>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
