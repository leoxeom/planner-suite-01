import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock, Users, Download, Edit, Trash2, AlertTriangle, Check, X, User, Wrench } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';
import { FeuilleDeRouteDownload } from '../../components/events/FeuilleDeRouteDownload';

interface Event {
  id: string;
  nom_evenement: string;
  date_debut: string;
  date_fin: string;
  lieu: string | null;
  statut_evenement: 'brouillon' | 'publie';
  specialites_requises: string[];
  regisseur_id: string;
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
  type_champ: 'son' | 'lumiere' | 'plateau' | 'general';
  contenu_texte: string | null;
  chemin_fichier_supabase_storage: string | null;
}

interface Assignment {
  id: string;
  intermittent_profile: {
    id: string;
    nom: string;
    prenom: string;
    specialite: string | null;
  };
  statut_disponibilite: string;
  date_reponse: string | null;
}

export const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [infoFields, setInfoFields] = useState<InfoField[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFeuilleDeRouteModal, setShowFeuilleDeRouteModal] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les informations de l'événement
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Récupérer les éléments de planning
      const { data: planningData, error: planningError } = await supabase
        .from('event_planning_items')
        .select('*')
        .eq('event_id', eventId)
        .order('ordre', { ascending: true });

      if (planningError) throw planningError;
      setPlanningItems(planningData || []);

      // Récupérer les champs d'information
      const { data: infoData, error: infoError } = await supabase
        .from('event_information_fields')
        .select('*')
        .eq('event_id', eventId);

      if (infoError) throw infoError;
      setInfoFields(infoData || []);

      // Récupérer les assignations d'intermittents
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('event_intermittent_assignments')
        .select(`
          id,
          statut_disponibilite,
          date_reponse,
          intermittent_profile:intermittent_profiles (
            id,
            nom,
            prenom,
            specialite
          )
        `)
        .eq('event_id', eventId);

      if (assignmentError) throw assignmentError;
      setAssignments(assignmentData || []);

    } catch (error) {
      console.error('Error fetching event data:', error);
      toast.error('Erreur lors du chargement des données de l\'événement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    // Redirection vers la page de modification avec l'ID de l'événement
    navigate(`/dashboard/events/edit/${eventId}`);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Supprimer les assignations d'intermittents
      const { error: assignmentError } = await supabase
        .from('event_intermittent_assignments')
        .delete()
        .eq('event_id', eventId);

      if (assignmentError) throw assignmentError;

      // Supprimer les éléments de planning
      const { error: planningError } = await supabase
        .from('event_planning_items')
        .delete()
        .eq('event_id', eventId);

      if (planningError) throw planningError;

      // Supprimer les champs d'information
      const { error: infoError } = await supabase
        .from('event_information_fields')
        .delete()
        .eq('event_id', eventId);

      if (infoError) throw infoError;

      // Supprimer l'événement
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (eventError) throw eventError;

      toast.success('Événement supprimé avec succès');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Erreur lors de la suppression de l\'événement');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusColor = (status: string) => {
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
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'propose':
        return 'Proposé';
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
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInfoFieldByType = (type: string) => {
    return infoFields.find(field => field.type_champ === type);
  };

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
            <h1 className="text-3xl font-bold">{event.nom_evenement}</h1>
            <span className={`px-3 py-1 rounded-full text-sm ${
              event.statut_evenement === 'brouillon' 
                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' 
                : 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-200'
            }`}>
              {event.statut_evenement === 'brouillon' ? 'Brouillon' : 'Publié'}
            </span>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              leftIcon={<Download size={18} />}
              onClick={() => setShowFeuilleDeRouteModal(true)}
            >
              Feuille de route
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Edit size={18} />}
              onClick={handleEdit}
            >
              Modifier
            </Button>
            <Button
              variant="danger"
              leftIcon={<Trash2 size={18} />}
              onClick={() => setShowDeleteModal(true)}
            >
              Supprimer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations générales */}
          <Card glass glow className="lg:col-span-2">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Informations générales</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar size={20} className="text-primary-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Dates
                    </p>
                    <p className="font-medium">
                      Du {formatDate(event.date_debut)} au {formatDate(event.date_fin)}
                    </p>
                  </div>
                </div>
                
                {event.lieu && (
                  <div className="flex items-center space-x-3">
                    <MapPin size={20} className="text-primary-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Lieu
                      </p>
                      <p className="font-medium">{event.lieu}</p>
                    </div>
                  </div>
                )}

                {event.specialites_requises && event.specialites_requises.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <Users size={20} className="text-primary-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Spécialités requises
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {event.specialites_requises.map((specialite, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-primary-900/20 text-primary-400 rounded-full text-sm"
                          >
                            {specialite.charAt(0).toUpperCase() + specialite.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Statistiques */}
          <Card glass glow>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
              <div className="space-y-4">
                <div className="p-4 bg-dark-800/50 backdrop-blur rounded-lg border border-white/5">
                  <p className="text-sm text-gray-400">Intermittents assignés</p>
                  <p className="text-2xl font-display mt-1">{assignments.length}</p>
                </div>
                <div className="p-4 bg-dark-800/50 backdrop-blur rounded-lg border border-white/5">
                  <p className="text-sm text-gray-400">Confirmés</p>
                  <p className="text-2xl font-display mt-1 text-primary-400">
                    {assignments.filter(a => a.statut_disponibilite === 'disponible' || a.statut_disponibilite === 'valide').length}
                  </p>
                </div>
                <div className="p-4 bg-dark-800/50 backdrop-blur rounded-lg border border-white/5">
                  <p className="text-sm text-gray-400">En attente</p>
                  <p className="text-2xl font-display mt-1 text-warning-400">
                    {assignments.filter(a => a.statut_disponibilite === 'propose').length}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Feuille de route */}
          <Card glass glow className="lg:col-span-2">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Feuille de route</h2>
              {planningItems.length > 0 ? (
                <div className="space-y-3">
                  {planningItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border ${
                        item.groupe === 'artistes'
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-secondary/30 bg-secondary/5'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="w-16 text-center">
                            <span className="text-lg font-medium">{item.heure}</span>
                          </div>
                          <div>
                            <p className="font-medium">{item.intitule}</p>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                          item.groupe === 'artistes'
                            ? 'bg-primary/20 text-primary-400'
                            : 'bg-secondary/20 text-secondary-400'
                        }`}>
                          {item.groupe === 'artistes' ? (
                            <><User size={14} /> Artistes</>
                          ) : (
                            <><Wrench size={14} /> Techniques</>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Aucun élément dans la feuille de route
                </p>
              )}
            </div>
          </Card>

          {/* Informations par spécialité */}
          <Card glass glow>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Informations par spécialité</h2>
              <div className="space-y-4">
                {['son', 'lumiere', 'plateau', 'general'].map((type) => {
                  const field = getInfoFieldByType(type);
                  if (!field || (!field.contenu_texte && !field.chemin_fichier_supabase_storage)) {
                    return null;
                  }
                  
                  return (
                    <div key={type} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h3 className="font-medium mb-2 capitalize">
                        {type === 'general' ? 'Général' : type}
                      </h3>
                      {field.contenu_texte && (
                        <p className="text-gray-300 whitespace-pre-wrap">{field.contenu_texte}</p>
                      )}
                      {field.chemin_fichier_supabase_storage && (
                        <a
                          href={field.chemin_fichier_supabase_storage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center mt-2 text-primary-400 hover:underline"
                        >
                          <Download size={16} className="mr-1" />
                          Télécharger le fichier
                        </a>
                      )}
                    </div>
                  );
                })}
                
                {!infoFields.length && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    Aucune information spécifique
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Assignations d'intermittents */}
          <Card glass glow className="lg:col-span-3">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Intermittents assignés</h2>
              {assignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-primary/30 transition-all"
                      onClick={() => navigate(`/dashboard/intermittents/profile/${assignment.intermittent_profile.id}`)}
                      role="button"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">
                            {assignment.intermittent_profile.prenom} {assignment.intermittent_profile.nom}
                          </h3>
                          {assignment.intermittent_profile.specialite && (
                            <p className="text-sm text-gray-400">
                              {assignment.intermittent_profile.specialite}
                            </p>
                          )}
                          {assignment.date_reponse && (
                            <p className="text-xs text-gray-500 mt-1">
                              Réponse le {new Date(assignment.date_reponse).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(assignment.statut_disponibilite)}`}>
                          {getStatusLabel(assignment.statut_disponibilite)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Aucun intermittent assigné
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modale de confirmation de suppression */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => !isDeleting && setShowDeleteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-dark-800 rounded-xl shadow-xl z-50 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-red-900/20">
                  <AlertTriangle size={24} className="text-red-400" />
                </div>
                <h3 className="text-xl font-bold">Confirmer la suppression</h3>
              </div>
              
              <p className="mb-6 text-gray-300">
                Êtes-vous sûr de vouloir supprimer l'événement "{event.nom_evenement}" ? 
                Cette action supprimera également toutes les assignations et informations associées.
                Elle est irréversible.
              </p>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => !isDeleting && setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  <X size={18} className="mr-2" />
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                >
                  <Trash2 size={18} className="mr-2" />
                  Supprimer définitivement
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modale pour la feuille de route */}
      <AnimatePresence>
        {showFeuilleDeRouteModal && (
          <FeuilleDeRouteDownload
            eventId={eventId!}
            onClose={() => setShowFeuilleDeRouteModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
