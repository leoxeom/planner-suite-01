import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Link, Search, ChevronDown, Filter, Users, Wrench } from 'lucide-react';
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
  groupe: 'artistes' | 'techniques';
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
    { id: '1', heure: '', intitule: '', groupe: 'techniques' },
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
          // Utilise la valeur du groupe de la base de données ou 'techniques' par défaut
          groupe: item.groupe || 'techniques',
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
    fetchIntermittents();
  }, []);

  const fetchIntermittents = async () => {
    try {
      const { data, error } = await supabase
        .from('intermittent_profiles')
        .select('id, nom, prenom, specialite')
        .order('nom');

      if (error) throw error;
      setIntermittents(data || []);
    } catch (error) {
      console.error('Error fetching intermittents:', error);
      toast.error('Erreur lors du chargement des intermittents');
    }
  };

  const handleEventDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEventData({ ...eventData, [name]: value });
  };

  const handlePlanningItemChange = (
    id: string,
    field: keyof PlanningItem,
    value: string | 'artistes' | 'techniques'
  ) => {
    setPlanningItems(
      planningItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addPlanningItem = () => {
    setPlanningItems([
      ...planningItems,
      { id: crypto.randomUUID(), heure: '', intitule: '', groupe: 'techniques' },
    ]);
  };

  const removePlanningItem = (id: string) => {
    setPlanningItems(planningItems.filter(item => item.id !== id));
  };

  const handleEventTextChange = (
    section: SectionType,
    value: string
  ) => {
    setEventTexts({ ...eventTexts, [section]: value });
  };

  const handleEventLinkChange = (
    section: SectionType,
    value: string
  ) => {
    setEventLinks({ ...eventLinks, [section]: value });
  };

  const toggleSpecialty = (specialty: Specialite) => {
    const newSpecialties = new Set(selectedSpecialties);
    if (newSpecialties.has(specialty)) {
      newSpecialties.delete(specialty);
    } else {
      newSpecialties.add(specialty);
    }
    setSelectedSpecialties(newSpecialties);
  };

  const toggleIntermittent = (id: string) => {
    const newSelected = new Set(selectedIntermittents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIntermittents(newSelected);
  };

  const toggleSection = (section: SectionType) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const filteredIntermittents = intermittents.filter(
    intermittent =>
      intermittent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intermittent.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (intermittent.specialite &&
        intermittent.specialite.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (publish: boolean) => {
    try {
      if (!eventData.nom_evenement || !eventData.date_debut || !eventData.date_fin) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      setIsLoading(true);

      // Validation des items du planning
      const validPlanningItems = planningItems.filter(
        item => item.heure.trim() !== '' && item.intitule.trim() !== ''
      );

      let currentEventId = '';

      if (isEditMode) {
        // Mise à jour de l'événement existant
        const { data: updatedEvent, error: updateError } = await supabase
          .from('events')
          .update({
            nom_evenement: eventData.nom_evenement,
            date_debut: eventData.date_debut,
            date_fin: eventData.date_fin,
            lieu: eventData.lieu,
            statut_evenement: publish ? 'publie' : 'brouillon',
            specialites_requises: Array.from(selectedSpecialties),
          })
          .eq('id', eventId)
          .select()
          .single();

        if (updateError) throw updateError;
        currentEventId = updatedEvent.id;

        // Supprimer les anciens items de planning
        await supabase
          .from('event_planning_items')
          .delete()
          .eq('event_id', currentEventId);

        // Supprimer les anciens champs d'information
        await supabase
          .from('event_information_fields')
          .delete()
          .eq('event_id', currentEventId);

        // Supprimer les anciennes assignations
        await supabase
          .from('event_intermittent_assignments')
          .delete()
          .eq('event_id', currentEventId);
      } else {
        // Création d'un nouvel événement
        const { data: newEvent, error: insertError } = await supabase
          .from('events')
          .insert({
            regisseur_id: user!.id,
            nom_evenement: eventData.nom_evenement,
            date_debut: eventData.date_debut,
            date_fin: eventData.date_fin,
            lieu: eventData.lieu,
            statut_evenement: publish ? 'publie' : 'brouillon',
            specialites_requises: Array.from(selectedSpecialties),
          })
          .select()
          .single();

        if (insertError) throw insertError;
        currentEventId = newEvent.id;
      }

      // Insertion des items de planning
      if (validPlanningItems.length > 0) {
        const planningData = validPlanningItems.map((item, index) => ({
          event_id: currentEventId,
          heure: item.heure,
          intitule: item.intitule,
          ordre: index,
          groupe: item.groupe, // Sauvegarde du groupe pour chaque item
        }));

        const { error: planningError } = await supabase
          .from('event_planning_items')
          .insert(planningData);

        if (planningError) throw planningError;
      }

      // Insertion des champs d'information
      const infoFields = [];
      for (const section of ['son', 'lumiere', 'plateau', 'general'] as SectionType[]) {
        if (eventTexts[section] || eventLinks[section]) {
          infoFields.push({
            event_id: currentEventId,
            type_champ: section,
            contenu_texte: eventTexts[section],
            chemin_fichier_supabase_storage: eventLinks[section],
          });
        }
      }

      if (infoFields.length > 0) {
        const { error: infoError } = await supabase
          .from('event_information_fields')
          .insert(infoFields);

        if (infoError) throw infoError;
      }

      // Insertion des assignations d'intermittents
      if (selectedIntermittents.size > 0) {
        const assignments = Array.from(selectedIntermittents).map(intermittentId => ({
          event_id: currentEventId,
          intermittent_profile_id: intermittentId,
          statut_disponibilite: 'propose',
        }));

        const { error: assignmentError } = await supabase
          .from('event_intermittent_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }

      toast.success(
        isEditMode
          ? 'Événement mis à jour avec succès'
          : 'Événement créé avec succès'
      );
      navigate(`/dashboard/regisseur/events/${currentEventId}`);
    } catch (error) {
      console.error('Error submitting event:', error);
      toast.error('Erreur lors de la soumission de l\'événement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {isEditMode ? 'Modifier l\'événement' : 'Créer un événement'}
        </h1>
      </div>

      {/* Informations générales */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Informations générales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="nom_evenement" className="block text-sm font-medium">
              Nom de l'événement *
            </label>
            <Input
              id="nom_evenement"
              name="nom_evenement"
              value={eventData.nom_evenement}
              onChange={handleEventDataChange}
              required
              placeholder="Nom de l'événement"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lieu" className="block text-sm font-medium">
              Lieu
            </label>
            <Input
              id="lieu"
              name="lieu"
              value={eventData.lieu}
              onChange={handleEventDataChange}
              placeholder="Lieu de l'événement"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="date_debut" className="block text-sm font-medium">
              Date de début *
            </label>
            <Input
              id="date_debut"
              name="date_debut"
              type="datetime-local"
              value={eventData.date_debut}
              onChange={handleEventDataChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="date_fin" className="block text-sm font-medium">
              Date de fin *
            </label>
            <Input
              id="date_fin"
              name="date_fin"
              type="datetime-local"
              value={eventData.date_fin}
              onChange={handleEventDataChange}
              required
            />
          </div>
        </div>
      </div>

      {/* Planning de la journée (Feuille de route) */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Feuille de route</h2>
        <div className="space-y-4">
          {planningItems.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-primary/30 transition-all"
            >
              <div className="w-full md:w-1/6">
                <Input
                  type="time"
                  value={item.heure}
                  onChange={(e) =>
                    handlePlanningItemChange(item.id, 'heure', e.target.value)
                  }
                  placeholder="Heure"
                />
              </div>
              <div className="flex-grow">
                <Input
                  value={item.intitule}
                  onChange={(e) =>
                    handlePlanningItemChange(item.id, 'intitule', e.target.value)
                  }
                  placeholder="Description de l'étape"
                />
              </div>
              
              {/* Sélecteur de groupe avec design moderne */}
              <div className="flex items-center space-x-2 bg-black/20 backdrop-blur-sm rounded-full p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => handlePlanningItemChange(item.id, 'groupe', 'artistes')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                    item.groupe === 'artistes'
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Users size={16} />
                  <span className="text-sm">Artistes</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePlanningItemChange(item.id, 'groupe', 'techniques')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                    item.groupe === 'techniques'
                      ? 'bg-secondary text-white shadow-lg shadow-secondary/30'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Wrench size={16} />
                  <span className="text-sm">Techniques</span>
                </button>
              </div>
              
              <button
                type="button"
                onClick={() => removePlanningItem(item.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                disabled={planningItems.length === 1}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addPlanningItem}
            className="flex items-center gap-2 text-primary hover:text-primary-600 transition-colors"
          >
            <Plus size={18} />
            <span>Ajouter une étape</span>
          </button>
        </div>
      </div>

      {/* Informations par spécialité */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Informations par spécialité</h2>
        <div className="space-y-4">
          {(['son', 'lumiere', 'plateau', 'general'] as SectionType[]).map((section) => (
            <div
              key={section}
              className="border border-white/10 rounded-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleSection(section)}
                className="w-full flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="font-medium capitalize">
                  {section === 'general' ? 'Général' : section}
                </span>
                <ChevronDown
                  size={20}
                  className={`transform transition-transform ${
                    expandedSections.has(section) ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {expandedSections.has(section) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">
                          Texte d'information
                        </label>
                        <textarea
                          value={eventTexts[section]}
                          onChange={(e) =>
                            handleEventTextChange(section, e.target.value)
                          }
                          placeholder={`Informations ${
                            section === 'general' ? 'générales' : `pour ${section}`
                          }`}
                          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium flex items-center gap-2">
                          <Link size={16} />
                          Lien vers un fichier
                        </label>
                        <Input
                          value={eventLinks[section]}
                          onChange={(e) =>
                            handleEventLinkChange(section, e.target.value)
                          }
                          placeholder="URL du fichier"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Spécialités requises */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Spécialités requises</h2>
        <div className="flex flex-wrap gap-3">
          {(['son', 'lumiere', 'plateau'] as Specialite[]).map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => toggleSpecialty(specialty)}
              className={`px-4 py-2 rounded-full border transition-all ${
                selectedSpecialties.has(specialty)
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {specialty.charAt(0).toUpperCase() + specialty.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Sélection des intermittents */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Sélection des intermittents</h2>
        <div className="mb-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, prénom ou spécialité..."
            className="pl-10"
          />
        </div>
        <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
          {filteredIntermittents.length === 0 ? (
            <p className="text-center text-gray-400 py-4">
              Aucun intermittent trouvé
            </p>
          ) : (
            filteredIntermittents.map((intermittent) => (
              <div
                key={intermittent.id}
                onClick={() => toggleIntermittent(intermittent.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                  selectedIntermittents.has(intermittent.id)
                    ? 'bg-primary/20 border border-primary/50'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <div>
                  <p className="font-medium">
                    {intermittent.prenom} {intermittent.nom}
                  </p>
                  {intermittent.specialite && (
                    <p className="text-sm text-gray-400">
                      {intermittent.specialite}
                    </p>
                  )}
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedIntermittents.has(intermittent.id)
                      ? 'bg-primary border-primary'
                      : 'border-gray-400'
                  }`}
                >
                  {selectedIntermittents.has(intermittent.id) && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSubmit(false)}
          disabled={isLoading}
        >
          Enregistrer comme brouillon
        </Button>
        <Button
          variant="primary"
          onClick={() => handleSubmit(true)}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>En cours...</span>
            </div>
          ) : (
            <span>Publier l'événement</span>
          )}
        </Button>
      </div>
    </div>
  );
};
