import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Link, Search, ChevronDown, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface PlanningItem {
  id: string;
  heure: string;
  intitule: string;
}

interface EventTexts {
  son: string;
  lumiere: string;
  plateau: string;
  general: string;
}

interface EventLinks {
  son: string;
  lumiere: string;
  plateau: string;
  general: string;
}

interface IntermittentProfile {
  id: string;
  nom: string;
  prenom: string;
  specialite: string | null;
}

type SectionType = 'son' | 'lumiere' | 'plateau' | 'general';
type Specialite = 'son' | 'lumiere' | 'plateau';

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [eventData, setEventData] = useState({
    nom_evenement: '',
    date_debut: '',
    date_fin: '',
    lieu: '',
  });
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([
    { id: '1', heure: '', intitule: '' },
  ]);
  const [eventTexts, setEventTexts] = useState<EventTexts>({
    son: '',
    lumiere: '',
    plateau: '',
    general: '',
  });
  const [eventLinks, setEventLinks] = useState<EventLinks>({
    son: '',
    lumiere: '',
    plateau: '',
    general: '',
  });
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<Specialite>>(new Set());
  const [intermittents, setIntermittents] = useState<IntermittentProfile[]>([]);
  const [selectedIntermittents, setSelectedIntermittents] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<SectionType>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (eventId) {
      setIsEditMode(true);
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      setEventData({
        nom_evenement: event.nom_evenement,
        date_debut: event.date_debut,
        date_fin: event.date_fin,
        lieu: event.lieu || '',
      });

      if (event.specialites_requises) {
        setSelectedSpecialties(new Set(event.specialites_requises));
      }

      const { data: planning, error: planningError } = await supabase
        .from('event_planning_items')
        .select('*')
        .eq('event_id', eventId)
        .order('ordre', { ascending: true });

      if (planningError) throw planningError;

      if (planning && planning.length > 0) {
        setPlanningItems(planning.map(item => ({
          id: item.id,
          heure: item.heure,
          intitule: item.intitule,
        })));
      }

      const { data: infoFields, error: infoError } = await supabase
        .from('event_information_fields')
        .select('*')
        .eq('event_id', eventId);

      if (infoError) throw infoError;

      if (infoFields) {
        const texts: EventTexts = { son: '', lumiere: '', plateau: '', general: '' };
        const links: EventLinks = { son: '', lumiere: '', plateau: '', general: '' };

        infoFields.forEach(field => {
          const type = field.type_champ as keyof EventTexts;
          texts[type] = field.contenu_texte || '';
          links[type] = field.chemin_fichier_supabase_storage || '';
        });

        setEventTexts(texts);
        setEventLinks(links);
      }

      const { data: assignments, error: assignmentsError } = await supabase
        .from('event_intermittent_assignments')
        .select('intermittent_profile_id')
        .eq('event_id', eventId);

      if (assignmentsError) throw assignmentsError;

      if (assignments) {
        setSelectedIntermittents(new Set(
          assignments.map(a => a.intermittent_profile_id)
        ));
      }

    } catch (error) {
      console.error('Error fetching event data:', error);
      toast.error('Erreur lors du chargement des données de l\'événement');
    }
  };

  useEffect(() => {
    const fetchIntermittents = async () => {
      try {
        const { data, error } = await supabase
          .from('intermittent_profiles')
          .select('id, nom, prenom, specialite');

        if (error) throw error;
        setIntermittents(data || []);
      } catch (error) {
        console.error('Error fetching intermittents:', error);
        toast.error('Erreur lors du chargement des intermittents');
      }
    };

    fetchIntermittents();
  }, []);

  const toggleSection = (section: SectionType) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const addPlanningItem = () => {
    setPlanningItems(prev => [
      ...prev,
      { id: String(prev.length + 1), heure: '', intitule: '' }
    ]);
  };

  const removePlanningItem = (id: string) => {
    setPlanningItems(prev => prev.filter(item => item.id !== id));
  };

  const updatePlanningItem = (id: string, field: keyof PlanningItem, value: string) => {
    setPlanningItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const toggleSpecialty = (specialty: Specialite) => {
    setSelectedSpecialties(prev => {
      const next = new Set(prev);
      if (next.has(specialty)) {
        next.delete(specialty);
      } else {
        next.add(specialty);
      }
      return next;
    });
  };

  const toggleIntermittent = (id: string) => {
    setSelectedIntermittents(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredIntermittents = intermittents.filter(intermittent => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      intermittent.nom.toLowerCase().includes(searchLower) ||
      intermittent.prenom.toLowerCase().includes(searchLower) ||
      (intermittent.specialite?.toLowerCase().includes(searchLower) ?? false);

    if (selectedSpecialties.size === 0) {
      return matchesSearch;
    }

    return (
      matchesSearch && 
      intermittent.specialite && 
      selectedSpecialties.has(intermittent.specialite as Specialite)
    );
  });

  const validateEventData = () => {
    const errors: string[] = [];

    if (!eventData.nom_evenement.trim()) {
      errors.push("Le nom de l'événement est requis");
    }
    if (!eventData.date_debut) {
      errors.push("La date de début est requise");
    }
    if (!eventData.date_fin) {
      errors.push("La date de fin est requise");
    }

    return errors;
  };

  const validateSubmission = () => {
    const errors: string[] = [];

    if (!eventData.nom_evenement.trim()) {
      errors.push("Le nom de l'événement est requis");
    }
    if (!eventData.date_debut) {
      errors.push("La date de début est requise");
    }
    if (!eventData.date_fin) {
      errors.push("La date de fin est requise");
    }
    if (!eventData.lieu?.trim()) {
      errors.push("Le lieu est requis");
    }

    const validPlanningItems = planningItems.filter(
      item => item.heure.trim() && item.intitule.trim()
    );
    if (validPlanningItems.length === 0) {
      errors.push("Au moins une étape de planning est requise");
    }

    if (selectedIntermittents.size === 0) {
      errors.push("Au moins un intermittent doit être sélectionné");
    }

    return errors;
  };

  const savePlanningItems = async (eventId: string) => {
    const validPlanningItems = planningItems.filter(
      item => item.heure.trim() && item.intitule.trim()
    );

    if (validPlanningItems.length === 0) {
      return { error: null };
    }

    const itemsToInsert = validPlanningItems.map((item, index) => ({
      event_id: eventId,
      heure: item.heure,
      intitule: item.intitule,
      ordre: index
    }));

    return await supabase
      .from('event_planning_items')
      .insert(itemsToInsert);
  };

  const saveInformationFields = async (eventId: string) => {
    const infoFields = [];
    
    for (const type of ['son', 'lumiere', 'plateau', 'general'] as const) {
      if (eventTexts[type] || eventLinks[type]) {
        infoFields.push({
          event_id: eventId,
          type_champ: type,
          contenu_texte: eventTexts[type] || null,
          chemin_fichier_supabase_storage: eventLinks[type] || null
        });
      }
    }

    if (infoFields.length === 0) {
      return { error: null };
    }

    return await supabase
      .from('event_information_fields')
      .insert(infoFields);
  };

  const saveIntermittentAssignments = async (eventId: string, isDraft: boolean) => {
    if (selectedIntermittents.size === 0) {
      return { error: null };
    }

    const assignments = Array.from(selectedIntermittents).map(intermittentId => ({
      event_id: eventId,
      intermittent_profile_id: intermittentId,
      statut_disponibilite: isDraft ? 'propose' : 'propose'
    }));

    return await supabase
      .from('event_intermittent_assignments')
      .insert(assignments);
  };

  const updateEvent = async (isDraft: boolean) => {
    try {
      const { data: updatedEvent, error: eventError } = await supabase
        .from('events')
        .update({
          nom_evenement: eventData.nom_evenement,
          date_debut: eventData.date_debut,
          date_fin: eventData.date_fin,
          lieu: eventData.lieu || null,
          statut_evenement: isDraft ? 'brouillon' : 'publie',
          specialites_requises: Array.from(selectedSpecialties)
        })
        .eq('id', eventId)
        .select()
        .single();

      if (eventError) throw eventError;

      const { error: deletePlanningError } = await supabase
        .from('event_planning_items')
        .delete()
        .eq('event_id', eventId);

      if (deletePlanningError) throw deletePlanningError;

      const { error: deleteInfoError } = await supabase
        .from('event_information_fields')
        .delete()
        .eq('event_id', eventId);

      if (deleteInfoError) throw deleteInfoError;

      const { error: deleteAssignmentsError } = await supabase
        .from('event_intermittent_assignments')
        .delete()
        .eq('event_id', eventId);

      if (deleteAssignmentsError) throw deleteAssignmentsError;

      const { error: planningError } = await savePlanningItems(eventId);
      if (planningError) throw planningError;

      const { error: infoError } = await saveInformationFields(eventId);
      if (infoError) throw infoError;

      const { error: assignmentError } = await saveIntermittentAssignments(eventId, isDraft);
      if (assignmentError) throw assignmentError;

      return { success: true, eventId: updatedEvent.id };
    } catch (error) {
      console.error('Error updating event:', error);
      return { success: false, error };
    }
  };

  const saveEvent = async (isDraft: boolean) => {
    try {
      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert([
          {
            nom_evenement: eventData.nom_evenement,
            date_debut: eventData.date_debut,
            date_fin: eventData.date_fin,
            lieu: eventData.lieu || null,
            regisseur_id: user!.id,
            statut_evenement: isDraft ? 'brouillon' : 'publie',
            specialites_requises: Array.from(selectedSpecialties)
          }
        ])
        .select()
        .single();

      if (eventError) throw eventError;

      const { error: planningError } = await savePlanningItems(newEvent.id);
      if (planningError) throw planningError;

      const { error: infoError } = await saveInformationFields(newEvent.id);
      if (infoError) throw infoError;

      const { error: assignmentError } = await saveIntermittentAssignments(newEvent.id, isDraft);
      if (assignmentError) throw assignmentError;

      return { success: true, eventId: newEvent.id };
    } catch (error) {
      console.error('Error saving event:', error);
      return { success: false, error };
    }
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!isDraft) {
      const validationErrors = validateSubmission();
      if (validationErrors.length > 0) {
        toast.error(
          <div>
            <p className="font-semibold mb-2">Veuillez corriger les erreurs suivantes :</p>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        );
        return;
      }
    } else {
      const validationErrors = validateEventData();
      if (validationErrors.length > 0) {
        toast.error(
          <div>
            <p className="font-semibold mb-2">Veuillez corriger les erreurs suivantes :</p>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      const { success, error } = isEditMode 
        ? await updateEvent(isDraft)
        : await saveEvent(isDraft);

      if (!success) throw error;

      toast.success(
        isEditMode
          ? isDraft
            ? "L'événement a été mis à jour en brouillon"
            : "L'événement a été mis à jour et publié"
          : isDraft
            ? "L'événement a été enregistré en brouillon"
            : <div>
                <p>Événement créé avec succès !</p>
                <p className="text-sm mt-1">
                  {selectedIntermittents.size} intermittent{selectedIntermittents.size > 1 ? 's' : ''} à contacter
                </p>
              </div>
      );

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error(
        error.message === 'JWT expired'
          ? 'Votre session a expiré. Veuillez vous reconnecter.'
          : "Une erreur est survenue lors de l'enregistrement"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex gap-8">
      <div className="flex-1 max-w-4xl space-y-8">
        <h1 className="text-3xl font-bold">
          {isEditMode ? 'Modifier l\'Événement' : 'Créer un Nouvel Événement'}
        </h1>

        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Informations Générales</h2>
          <div className="space-y-4">
            <Input
              label="Nom de l'événement"
              value={eventData.nom_evenement}
              onChange={(e) => setEventData({ ...eventData, nom_evenement: e.target.value })}
              placeholder="Ex: Concert de Jazz"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Date de début"
                value={eventData.date_debut}
                onChange={(e) => setEventData({ ...eventData, date_debut: e.target.value })}
                required
              />

              <Input
                type="date"
                label="Date de fin"
                value={eventData.date_fin}
                onChange={(e) => setEventData({ ...eventData, date_fin: e.target.value })}
                min={eventData.date_debut}
                required
              />
            </div>

            <Input
              label="Lieu"
              value={eventData.lieu}
              onChange={(e) => setEventData({ ...eventData, lieu: e.target.value })}
              placeholder="Ex: Salle des fêtes"
              required
            />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Planning de la journée</h2>
            <Button
              variant="ghost"
              onClick={addPlanningItem}
              leftIcon={<Plus size={18} />}
            >
              Ajouter une étape
            </Button>
          </div>

          <div className="space-y-4">
            {planningItems.map((item) => (
              <div key={item.id} className="flex gap-4 items-start">
                <Input
                  type="time"
                  value={item.heure}
                  onChange={(e) => updatePlanningItem(item.id, 'heure', e.target.value)}
                  className="w-32"
                  required
                />
                <Input
                  value={item.intitule}
                  onChange={(e) => updatePlanningItem(item.id, 'intitule', e.target.value)}
                  placeholder="Description de l'étape"
                  required
                />
                {planningItems.length > 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => removePlanningItem(item.id)}
                    className="shrink-0"
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Informations par Spécialité</h2>

          <div className="space-y-4">
            {(['son', 'lumiere', 'plateau', 'general'] as const).map((type) => (
              <div key={type} className="border dark:border-dark-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(type)}
                  className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 dark:bg-dark-900 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                >
                  <h3 className="text-lg font-medium capitalize">
                    {type === 'general' ? 'Informations Générales' : `Informations ${type}`}
                  </h3>
                  <motion.div
                    animate={{ rotate: expandedSections.has(type) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedSections.has(type) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                            Notes et consignes
                          </label>
                          <textarea
                            value={eventTexts[type]}
                            onChange={(e) => setEventTexts(prev => ({ ...prev, [type]: e.target.value }))}
                            placeholder={`Saisissez ici les informations détaillées pour ${type === 'general' ? 'tous' : type}`}
                            className="w-full h-48 px-4 py-2.5 rounded-lg bg-white dark:bg-dark-900 border dark:border-dark-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 font-mono"
                          />
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Utilisez des listes avec - ou * pour plus de clarté. Vous pouvez aussi utiliser des # pour les titres.
                          </p>
                        </div>

                        <Input
                          label={`Lien vers le dossier ${type === 'general' ? 'général' : type} (ex: Google Drive)`}
                          value={eventLinks[type]}
                          onChange={(e) => setEventLinks(prev => ({ ...prev, [type]: e.target.value }))}
                          placeholder="https://drive.google.com/..."
                          leftIcon={<Link size={18} className="text-gray-500" />}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Spécialités Requises</h2>
          <div className="flex flex-wrap gap-4">
            {(['son', 'lumiere', 'plateau'] as const).map((specialty) => (
              <button
                key={specialty}
                onClick={() => toggleSpecialty(specialty)}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  selectedSpecialties.has(specialty)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <span className="capitalize">{specialty}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sélectionnez les spécialités techniques nécessaires pour cet événement
          </p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Intermittents à Convoquer pour cet Événement</h2>

          <div className="mb-6">
            <Input
              placeholder="Rechercher un intermittent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} className="text-gray-500" />}
              rightIcon={
                selectedSpecialties.size > 0 && (
                  <div className="flex items-center space-x-2 px-2 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                    <Filter size={14} className="text-primary-500" />
                    <span className="text-sm text-primary-700 dark:text-primary-300">
                      {selectedSpecialties.size} filtre{selectedSpecialties.size > 1 ? 's' : ''}
                    </span>
                  </div>
                )
              }
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredIntermittents.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                {searchTerm || selectedSpecialties.size > 0
                  ? 'Aucun intermittent ne correspond aux critères'
                  : 'Chargement des intermittents...'}
              </p>
            ) : (
              filteredIntermittents.map((intermittent) => (
                <label
                  key={intermittent.id}
                  className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-dark-900 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIntermittents.has(intermittent.id)}
                    onChange={() => toggleIntermittent(intermittent.id)}
                    className="mr-3 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-medium">
                      {intermittent.prenom} {intermittent.nom}
                    </span>
                    {intermittent.specialite && (
                      <span className={`ml-2 text-sm ${
                        selectedSpecialties.has(intermittent.specialite as Specialite)
                          ? 'text-primary-600 dark:text-primary-400 font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        ({intermittent.specialite})
                      </span>
                    )}
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="fixed top-24 right-8 w-64" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
        <div className="w-full bg-dark-800/80 backdrop-blur-lg border border-white/10 rounded-xl p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Actions
            </h3>
            <div className="h-px bg-gradient-to-r from-primary-500/50 to-transparent" />
          </div>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              isLoading={isLoading}
              className="w-full justify-center"
            >
              {isEditMode ? (
                <>
                  <span className="block text-xs text-gray-400">Mettre à jour en</span>
                  <span>Brouillon</span>
                </>
              ) : (
                <>
                  <span className="block text-xs text-gray-400">Enregistrer en</span>
                  <span>Brouillon</span>
                </>
              )}
            </Button>
            
            <Button
              onClick={() => handleSubmit(false)}
              isLoading={isLoading}
              className="w-full justify-center"
              glow
            >
              {isEditMode ? (
                <>
                  <span className="block text-xs">Mettre à jour et</span>
                  <span>Publier</span>
                </>
              ) : (
                <>
                  <span className="block text-xs">Soumettre aux</span>
                  <span>Intermittents</span>
                </>
              )}
            </Button>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-gray-400 leading-relaxed">
              En mode brouillon, l'événement ne sera pas visible par les intermittents. 
              Vous pourrez le modifier ultérieurement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};