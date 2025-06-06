import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Copy, Check, AlertCircle, Eye, EyeOff, Phone, Mail, MapPin, CreditCard, FileText, Trash2, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';

interface EventAssignment {
  event: {
    id: string;
    nom_evenement: string;
    date_debut: string;
    date_fin: string;
    lieu: string | null,
    statut_evenement: string;
  };
  statut_disponibilite: string;
  date_reponse: string | null;
}

interface IntermittentProfile {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  specialite: string | null;
  adresse: string | null;
  numero_secu: string | null;
  num_conges_spectacles: string | null;
  date_visite_medicale: string | null;
  user_id: string;
}

export const IntermittentProfile: React.FC = () => {
  const { intermittentId } = useParams<{ intermittentId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<IntermittentProfile | null>(null);
  const [assignments, setAssignments] = useState<EventAssignment[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (intermittentId) {
      Promise.all([
        fetchProfile(),
        fetchAssignments()
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [intermittentId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('intermittent_profiles')
        .select('*')
        .eq('id', intermittentId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erreur lors du chargement du profil');
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('event_intermittent_assignments')
        .select(`
          id,
          statut_disponibilite,
          date_reponse,
          event:events (
            id,
            nom_evenement,
            date_debut,
            date_fin,
            lieu,
            statut_evenement
          )
        `)
        .eq('intermittent_profile_id', intermittentId)
        .order('event(date_debut)', { ascending: false });

      if (error) throw error;
      
      setAssignments(data.filter(a => a.event) as EventAssignment[]);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Erreur lors du chargement des assignations');
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success('Copié dans le presse-papiers !');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Erreur lors de la copie');
    }
  };

  const handleDelete = async () => {
    if (!profile) return;
    
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-intermittent-user', {
        body: { intermittent_user_id: profile.user_id }
      });

      if (error) throw error;

      toast.success(`Le profil de ${profile.prenom} ${profile.nom} a été supprimé`);
      navigate('/dashboard/intermittents');
    } catch (error) {
      console.error('Error deleting intermittent:', error);
      toast.error('Erreur lors de la suppression du profil');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const isMedicalVisitExpired = (date: string | null) => {
    if (!date) return false;
    const visitDate = new Date(date);
    return visitDate <= new Date();
  };

  const isMedicalVisitExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const visitDate = new Date(date);
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    return visitDate <= oneMonthFromNow && !isMedicalVisitExpired(date);
  };

  const getMedicalVisitStatus = (date: string | null) => {
    if (!date) return null;
    if (isMedicalVisitExpired(date)) {
      return {
        type: 'error',
        message: `Visite médicale expirée depuis le ${new Date(date).toLocaleDateString('fr-FR')}`,
        color: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-200'
      };
    }
    if (isMedicalVisitExpiringSoon(date)) {
      return {
        type: 'warning',
        message: `Visite médicale expirant le ${new Date(date).toLocaleDateString('fr-FR')}`,
        color: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-200'
      };
    }
    return null;
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

  const CopyableField: React.FC<{
    label: string;
    value: string | null;
    fieldName: string;
    sensitive?: boolean;
    icon?: React.ReactNode;
  }> = ({ 
    label, 
    value, 
    fieldName, 
    sensitive = false,
    icon
  }) => {
    if (!value) return null;

    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center space-x-3">
          {icon && <span className="text-primary-400">{icon}</span>}
          <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
          <p className="font-medium">
            {sensitive && !showSensitiveData ? '••••••••' : value}
          </p>
        </div>
        <button
          onClick={() => copyToClipboard(value, fieldName)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors relative group"
        >
          {copiedField === fieldName ? (
            <Check size={18} className="text-success-500" />
          ) : (
            <Copy size={18} className="text-gray-500" />
          )}
          <span className="absolute right-0 top-full mt-1 px-2 py-1 text-xs bg-dark-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {copiedField === fieldName ? 'Copié !' : 'Copier'}
          </span>
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          Profil non trouvé
        </p>
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/intermittents')}
          className="mt-4"
        >
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/intermittents')}
            leftIcon={<ArrowLeft size={20} />}
          >
            Retour
          </Button>
          <h1 className="text-3xl font-bold">
            Profil de : {profile.prenom} {profile.nom}
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card glass glow>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Informations Personnelles</h2>
                  {profile?.specialite && (
                    <span className="px-3 py-1 bg-primary-900/20 text-primary-400 rounded-full text-sm">
                      {profile.specialite}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 divide-y dark:divide-dark-700">
                  <CopyableField
                    label="Email"
                    value={profile.email}
                    fieldName="email"
                    icon={<Mail size={18} />}
                  />
                  <CopyableField
                    label="Téléphone"
                    value={profile.telephone}
                    fieldName="telephone"
                    icon={<Phone size={18} />}
                  />
                  <CopyableField
                    label="Adresse"
                    value={profile.adresse}
                    fieldName="adresse"
                    icon={<MapPin size={18} />}
                  />
                </div>
              </div>
            </Card>

            <Card glass glow>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Informations Administratives</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowSensitiveData(!showSensitiveData)}
                    leftIcon={showSensitiveData ? <EyeOff size={18} /> : <Eye size={18} />}
                  >
                    {showSensitiveData ? 'Masquer' : 'Afficher'}
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {profile?.date_visite_medicale && (
                    <div>
                      {getMedicalVisitStatus(profile.date_visite_medicale) && (
                        <div className={`mb-4 p-3 rounded-lg flex items-center space-x-3 ${
                          getMedicalVisitStatus(profile.date_visite_medicale)?.color
                        }`}>
                          <AlertCircle size={20} />
                          <span>{getMedicalVisitStatus(profile.date_visite_medicale)?.message}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <Calendar size={18} className="text-primary-400" />
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Date de visite médicale
                            </span>
                            <p className="font-medium">
                              {new Date(profile.date_visite_medicale).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 divide-y dark:divide-dark-700">
                    <CopyableField
                      label="Numéro de Sécurité Sociale"
                      value={profile.numero_secu}
                      fieldName="numero_secu"
                      sensitive
                      icon={<FileText size={18} />}
                    />
                    <CopyableField
                      label="Numéro Congés Spectacles"
                      value={profile.num_conges_spectacles}
                      fieldName="conges_spectacles"
                      icon={<CreditCard size={18} />}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card glass glow>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Historique des Assignations</h2>
                {assignments.length > 0 ? (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <button
                        key={assignment.event.id}
                        onClick={() => navigate(`/dashboard/events/${assignment.event.id}`)}
                        className="w-full text-left"
                      >
                        <div className="p-4 bg-dark-800/50 backdrop-blur rounded-lg border border-white/5 hover:bg-dark-700/50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <h3 className="font-medium text-lg group-hover:text-primary-400 transition-colors">
                                {assignment.event.nom_evenement}
                              </h3>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-400 flex items-center">
                                  <Calendar size={14} className="mr-2" />
                                  Du {new Date(assignment.event.date_debut).toLocaleDateString('fr-FR')} au{' '}
                                  {new Date(assignment.event.date_fin).toLocaleDateString('fr-FR')}
                                </p>
                                {assignment.event.lieu && (
                                  <p className="text-sm text-gray-400 flex items-center">
                                    <MapPin size={14} className="mr-2" />
                                    {assignment.event.lieu}
                                  </p>
                                )}
                                {assignment.date_reponse && (
                                  <p className="text-sm text-gray-400 flex items-center">
                                    <Clock size={14} className="mr-2" />
                                    Répondu le {new Date(assignment.date_reponse).toLocaleDateString('fr-FR')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(assignment.statut_disponibilite)}`}>
                                {getStatusLabel(assignment.statut_disponibilite)}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(assignment.event.statut_evenement)}`}>
                                {assignment.event.statut_evenement.charAt(0).toUpperCase() + assignment.event.statut_evenement.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    Aucune assignation à des événements
                  </p>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card glass glow>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-dark-800/50 backdrop-blur rounded-lg border border-white/5">
                    <p className="text-sm text-gray-400">Événements assignés</p>
                    <p className="text-2xl font-display mt-1">{assignments.length}</p>
                  </div>
                  <div className="p-4 bg-dark-800/50 backdrop-blur rounded-lg border border-white/5">
                    <p className="text-sm text-gray-400">Événements validés</p>
                    <p className="text-2xl font-display mt-1 text-primary-400">
                      {assignments.filter(a => a.statut_disponibilite === 'valide').length}
                    </p>
                  </div>
                  <div className="p-4 bg-dark-800/50 backdrop-blur rounded-lg border border-white/5">
                    <p className="text-sm text-gray-400">En attente de réponse</p>
                    <p className="text-2xl font-display mt-1 text-warning-400">
                      {assignments.filter(a => a.statut_disponibilite === 'propose').length}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card glass>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Actions</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(true)}
                  leftIcon={<Trash2 size={18} />}
                  className="w-full border-error-500 text-error-500 hover:bg-error-500/10"
                >
                  Supprimer ce Profil
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

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
              <h3 className="text-xl font-semibold mb-4">
                Confirmer la suppression
              </h3>
              <p className="text-gray-300 mb-6">
                Êtes-vous sûr de vouloir supprimer définitivement le profil de {profile?.prenom} {profile?.nom} ? 
                Cette action supprimera son compte utilisateur, son profil, et toutes ses assignations. 
                Elle est irréversible.
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
                  Oui, Supprimer Définitivement
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};