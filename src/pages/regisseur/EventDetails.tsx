import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, LinkIcon, Edit, Trash2, Clock, Check, X, UserCheck, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

interface Event {
  id: string;
  nom_evenement: string;
  date_debut: string;
  date_fin: string;
  lieu: string | null;
  statut_evenement: 'brouillon' | 'publie' | 'complet' | 'annule';
}

interface PlanningItem {
  id: string;
  heure: string;
  intitule: string;
  ordre: number;
}

interface InfoField {
  id: string;
  type_champ: 'son' | 'lumiere' | 'plateau' | 'general';
  contenu_texte: string | null;
  chemin_fichier_supabase_storage: string | null;
}

interface IntermittentAssignment {
  id: string;
  statut_disponibilite: 'propose' | 'disponible' | 'incertain' | 'non_disponible' | 'valide' | 'refuse' | 'non_retenu' | 'en_attente_reponse';
  date_reponse: string | null;
  intermittent_profiles: {
    id: string;
    nom: string;
    prenom: string;
    specialite: string | null;
  };
}

export const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [infoFields, setInfoFields] = useState<InfoField[]>([]);
  const [assignments, setAssignments] = useState<IntermittentAssignment[]>([]);
  const [selectedIntermittents, setSelectedIntermittents] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch planning items
      const { data: planningData, error: planningError } = await supabase
        .from('event_planning_items')
        .select('*')
        .eq('event_id', eventId)
        .order('ordre', { ascending: true });

      if (planningError) throw planningError;
      setPlanningItems(planningData || []);

      // Fetch information fields
      const { data: infoData, error: infoError } = await supabase
        .from('event_information_fields')
        .select('*')
        .eq('event_id', eventId);

      if (infoError) throw infoError;
      setInfoFields(infoData || []);

      // Fetch intermittent assignments with profiles
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('event_intermittent_assignments')
        .select(`
          id,
          statut_disponibilite,
          date_reponse,
          intermittent_profiles (
            id,
            nom,
            prenom,
            specialite
          )
        `)
        .eq('event_id', eventId);

      if (assignmentError) throw assignmentError;
      setAssignments(assignmentData || []);

      // Initialize selected intermittents from those already validated
      const validatedIds = new Set(
        assignmentData
          ?.filter(a => a.statut_disponibilite === 'valide')
          .map(a => a.id) || []
      );
      setSelectedIntermittents(validatedIds);

    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error('Erreur lors du chargement des détails de l\'événement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      toast.success(`L'événement "${event.nom_evenement}" a été supprimé`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Erreur lors de la suppression de l\'événement');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: IntermittentAssignment['statut_disponibilite']) => {
    switch (status) {
      case 'propose':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'disponible':
        return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-200';
      case 'incertain':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-200';
      case 'non_disponible':
        return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-200';
      case 'valide':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200';
      case 'non_retenu':
        return 'bg-gray-100/50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400';
      case 'refuse':
        return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-200';
      case 'en_attente_reponse':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: IntermittentAssignment['statut_disponibilite']) => {
    switch (status) {
      case 'propose':
        return 'En attente de réponse';
      case 'disponible':
        return 'Disponible';
      case 'incertain':
        return 'Incertain';
      case 'non_disponible':
        return 'Non disponible';
      case 'valide':
        return 'Validé';
      case 'non_retenu':
        return 'Non retenu';
      case 'refuse':
        return 'Refusé';
      case 'en_attente_reponse':
        return 'En attente de réponse';
      default:
        return status;
    }
  };

  const handleEdit = () => {
    navigate(`/dashboard/events/edit/${eventId}`);
  };

  const toggleIntermittentSelection = (assignmentId: string) => {
    setSelectedIntermittents(prev => {
      const next = new Set(prev);
      if (next.has(assignmentId)) {
        next.delete(assignmentId);
      } else {
        next.add(assignmentId);
      }
      return next;
    });
  };

  const handleValidateTeam = async () => {
    if (selectedIntermittents.size === 0) {
      toast.error('Veuillez sélectionner au moins un intermittent');
      return;
    }

    setIsValidating(true);
    try {
      // Update selected intermittents to 'valide'
      const validatePromises = Array.from(selectedIntermittents).map(assignmentId =>
        supabase
          .from('event_intermittent_assignments')
          .update({ statut_disponibilite: 'valide' })
          .eq('id', assignmentId)
      );

      // Update non-selected intermittents to 'non_retenu'
      const nonSelectedIds = assignments
        .filter(a => 
          !selectedIntermittents.has(a.id) && 
          ['disponible', 'incertain', 'propose'].includes(a.statut_disponibilite)
        )
        .map(a => a.id);

      if (nonSelectedIds.length > 0) {
        validatePromises.push(
          supabase
            .from('event_intermittent_assignments')
            .update({ statut_disponibilite: 'non_retenu' })
            .eq('id', nonSelectedIds[0])
        );

        // Handle remaining non-selected intermittents one by one to avoid array parameter issues
        for (let i = 1; i < nonSelectedIds.length; i++) {
          validatePromises.push(
            supabase
              .from('event_intermittent_assignments')
              .update({ statut_disponibilite: 'non_retenu' })
              .eq('id', nonSelectedIds[i])
          );
        }
      }

      const results = await Promise.all(validatePromises);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        console.error('Validation errors:', errors);
        throw new Error('Erreur lors de la validation de certains intermittents');
      }

      // Refresh assignments to show updated statuses
      await fetchEventDetails();

      toast.success('L\'équipe a été validée avec succès !');
      
    } catch (error) {
      console.error('Error validating team:', error);
      toast.error('Erreur lors de la validation de l\'équipe');
    } finally {
      setIsValidating(false);
    }
  };

  const isTeamFinalized = assignments.some(a => a.statut_disponibilite === 'valide');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          Événement non trouvé
        </p>
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mt-4"
        >
          Retour au tableau de bord
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              leftIcon={<ArrowLeft size={20} />}
            >
              Retour
            </Button>
            <h1 className="text-3xl font-bold">
              {event.nom_evenement}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              leftIcon={<Trash2 size={20} className="text-error-500" />}
              className="border-error-500 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20"
            >
              Supprimer
            </Button>
            <Button
              onClick={handleEdit}
              leftIcon={<Edit size={20} />}
            >
              Modifier
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusColor(event.statut_evenement)}`}>
                  {event.statut_evenement.charAt(0).toUpperCase() + event.statut_evenement.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Planning */}
          {planningItems.length > 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Planning de la Journée</h2>
              <div className="space-y-3">
                {planningItems.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-dark-900 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Clock className="text-primary" />
                      <div className="w-20 font-mono text-primary">
                        {formatTime(item.heure)}
                      </div>
                    </div>
                    <div className="flex-1">
                      {item.intitule}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Information Fields */}
          {infoFields.length > 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Informations par Spécialité</h2>
              <div className="space-y-6">
                {(['son', 'lumiere', 'plateau', 'general'] as const).map((type) => {
                  const info = infoFields.find(field => field.type_champ === type);
                  if (!info?.contenu_texte && !info?.chemin_fichier_supabase_storage) return null;

                  return (
                    <div key={type} className="border-b dark:border-dark-700 last:border-0 pb-4 last:pb-0">
                      <h3 className="text-lg font-medium mb-3 capitalize">
                        {type === 'general' ? 'Informations Générales' : `Informations ${type}`}
                      </h3>
                      
                      {info.contenu_texte && (
                        <div className="prose dark:prose-invert max-w-none mb-3">
                          <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 dark:bg-dark-900 p-4 rounded-lg">
                            {info.contenu_texte}
                          </pre>
                        </div>
                      )}
                      
                      {info.chemin_fichier_supabase_storage && (
                        <a
                          href={info.chemin_fichier_supabase_storage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <LinkIcon size={16} />
                          <span>Accéder au dossier {type}</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Intermittents Tracking */}
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Suivi des Intermittents</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {assignments.length} intermittent{assignments.length > 1 ? 's' : ''} convoqué{assignments.length > 1 ? 's' : ''}
                </p>
              </div>
              {assignments.length > 0 && !isTeamFinalized && (
                <Button
                  onClick={handleValidateTeam}
                  isLoading={isValidating}
                  disabled={selectedIntermittents.size === 0 || isValidating}
                  leftIcon={<UserCheck size={20} />}
                  className="bg-success-600 hover:bg-success-700"
                >
                  Valider l'équipe sélectionnée
                </Button>
              )}
            </div>
            
            {assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const isSelectable = ['disponible', 'incertain'].includes(assignment.statut_disponibilite);
                  const isSelected = selectedIntermittents.has(assignment.id);
                  
                  return (
                    <div
                      key={assignment.id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500'
                          : assignment.statut_disponibilite === 'non_retenu'
                          ? 'bg-gray-50/50 dark:bg-dark-900/50'
                          : 'bg-gray-50 dark:bg-dark-900'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className={`font-medium ${
                            assignment.statut_disponibilite === 'non_retenu'
                              ? 'text-gray-500 dark:text-gray-400'
                              : ''
                          }`}>
                            {assignment.intermittent_profiles.prenom} {assignment.intermittent_profiles.nom}
                          </h3>
                          {assignment.intermittent_profiles.specialite && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {assignment.intermittent_profiles.specialite}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.statut_disponibilite)}`}>
                          {getStatusLabel(assignment.statut_disponibilite)}
                        </span>
                        
                        {assignment.date_reponse && assignment.statut_disponibilite !== 'non_retenu' && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Répondu le {new Date(assignment.date_reponse).toLocaleDateString('fr-FR')}
                          </span>
                        )}

                        {!isTeamFinalized && isSelectable && (
                          <Button
                            variant={isSelected ? 'primary' : 'outline'}
                            onClick={() => toggleIntermittentSelection(assignment.id)}
                            leftIcon={isSelected ? <Check size={18} /> : <Users size={18} />}
                            className="ml-4"
                          >
                            {isSelected ? 'Sélectionné' : 'Sélectionner'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                Aucun intermittent n'a encore été convoqué pour cet événement.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => !isDeleting && setShowDeleteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-dark-800 rounded-xl shadow-xl z-50 p-6"
            >
              <h3 className="text-xl font-semibold mb-4">
                Confirmer la suppression
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Êtes-vous sûr de vouloir supprimer l'événement "{event.nom_evenement}" ? Cette action est irréversible.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => !isDeleting && setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  className="bg-error-600 hover:bg-error-700"
                >
                  Oui, supprimer
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};