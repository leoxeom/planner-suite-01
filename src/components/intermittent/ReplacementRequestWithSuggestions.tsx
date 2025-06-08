import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { AlertTriangle, MessageSquare, X, Check, Search, UserPlus, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuthStore } from '../../store/authStore';

interface ReplacementRequestWithSuggestionsProps {
  eventId: string;
  assignmentId: string;
  eventName: string;
  eventDate: string;
  onRequestSubmitted: () => void;
  onCancel: () => void;
}

interface IntermittentProfile {
  id: string;
  nom: string;
  prenom: string;
  specialite: string | null;
  avatar_url: string | null;
}

export const ReplacementRequestWithSuggestions: React.FC<ReplacementRequestWithSuggestionsProps> = ({
  eventId,
  assignmentId,
  eventName,
  eventDate,
  onRequestSubmitted,
  onCancel
}) => {
  const { user } = useAuthStore();
  const [availableIntermittents, setAvailableIntermittents] = useState<IntermittentProfile[]>([]);
  const [selectedIntermittents, setSelectedIntermittents] = useState<Set<string>>(new Set());
  const [requestType, setRequestType] = useState<'urgent' | 'souhaite'>('souhaite');
  const [comment, setComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAvailableIntermittents();
  }, [eventId]);

  const fetchAvailableIntermittents = async () => {
    try {
      setIsLoading(true);

      // 1. Récupérer les intermittents déjà assignés à cet événement
      const { data: assignedIntermittents, error: assignedError } = await supabase
        .from('event_intermittent_assignments')
        .select('intermittent_profile_id')
        .eq('event_id', eventId);

      if (assignedError) throw assignedError;

      // Extraire les IDs des intermittents déjà assignés
      const assignedIds = assignedIntermittents.map(item => item.intermittent_profile_id);

      // 2. Récupérer les intermittents qui ne sont pas assignés à cet événement
      // et qui n'ont pas d'autres événements en conflit de date
      const { data: availableProfiles, error: availableError } = await supabase
        .from('intermittent_profiles')
        .select('id, nom, prenom, specialite, avatar_url')
        .not('id', 'in', `(${assignedIds.join(',')})`)
        .order('nom');

      if (availableError) throw availableError;

      // 3. Filtrer davantage pour exclure ceux qui ont des conflits de date
      // Note: Une implémentation complète nécessiterait de vérifier les conflits de date
      // avec d'autres événements, mais cela nécessiterait une requête plus complexe

      setAvailableIntermittents(availableProfiles || []);
    } catch (error) {
      console.error('Error fetching available intermittents:', error);
      toast.error('Erreur lors du chargement des intermittents disponibles');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIntermittentSelection = (id: string) => {
    const newSelected = new Set(selectedIntermittents);
    
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      // Limiter à 3 sélections maximum
      if (newSelected.size < 3) {
        newSelected.add(id);
      } else {
        toast.error('Vous pouvez suggérer un maximum de 3 intermittents');
        return;
      }
    }
    
    setSelectedIntermittents(newSelected);
  };

  const handleSubmit = async () => {
    try {
      if (!comment.trim()) {
        toast.error('Veuillez fournir une raison pour votre demande de remplacement');
        return;
      }

      setIsSubmitting(true);

      // Récupérer l'ID du profil intermittent
      const { data: profile, error: profileError } = await supabase
        .from('intermittent_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (profileError) throw profileError;

      // Récupérer l'ID du régisseur
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('regisseur_id')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Créer la demande de remplacement avec suggestions
      const { data, error } = await supabase
        .from('replacement_requests')
        .insert({
          event_assignment_id: assignmentId,
          requester_intermittent_profile_id: profile.id,
          regisseur_id: event.regisseur_id,
          request_type: requestType,
          comment: comment,
          suggested_intermittent_profile_ids: Array.from(selectedIntermittents).length > 0 
            ? Array.from(selectedIntermittents) 
            : null,
          status: 'pending_approval'
        });

      if (error) throw error;

      // Créer une notification pour le régisseur
      await supabase
        .from('notifications')
        .insert({
          user_id: event.regisseur_id,
          type: 'replacement_request',
          content: `Demande de remplacement pour "${eventName}"`,
          related_event_id: eventId,
          related_request_id: data?.[0]?.id,
          is_read: false
        });

      toast.success('Votre demande de remplacement a été envoyée');
      onRequestSubmitted();
    } catch (error) {
      console.error('Error submitting replacement request:', error);
      toast.error('Erreur lors de l\'envoi de la demande de remplacement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrer les intermittents en fonction du terme de recherche
  const filteredIntermittents = availableIntermittents.filter(
    intermittent =>
      intermittent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intermittent.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (intermittent.specialite &&
        intermittent.specialite.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl max-w-3xl w-full"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Demander un remplacement</h3>
        <button
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mb-6">
        <h4 className="font-medium text-lg">{eventName}</h4>
        <p className="text-gray-300">{new Date(eventDate).toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>

      <div className="space-y-6">
        {/* Type de demande */}
        <div>
          <label className="block text-sm font-medium mb-2">Type de demande</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRequestType('urgent')}
              className={`flex-1 p-3 rounded-lg border transition-all ${
                requestType === 'urgent'
                  ? 'bg-red-900/20 border-red-500/30 text-red-400'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle size={18} />
                <span>Urgent</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRequestType('souhaite')}
              className={`flex-1 p-3 rounded-lg border transition-all ${
                requestType === 'souhaite'
                  ? 'bg-blue-900/20 border-blue-500/30 text-blue-400'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageSquare size={18} />
                <span>Souhait</span>
              </div>
            </button>
          </div>
        </div>

        {/* Raison de la demande */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-2">
            Raison de la demande
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            rows={4}
            placeholder="Expliquez pourquoi vous demandez un remplacement..."
          />
        </div>

        {/* Suggestions d'intermittents */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium">
              Suggérer des remplaçants (max. 3)
            </label>
            <span className="text-xs text-gray-400">
              {selectedIntermittents.size}/3 sélectionnés
            </span>
          </div>

          {/* Barre de recherche */}
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

          {/* Liste des intermittents disponibles */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredIntermittents.length === 0 ? (
            <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
              <User size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-400">
                {searchTerm ? 'Aucun intermittent ne correspond à votre recherche' : 'Aucun intermittent disponible'}
              </p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
              <AnimatePresence>
                {filteredIntermittents.map((intermittent) => (
                  <motion.div
                    key={intermittent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => toggleIntermittentSelection(intermittent.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                      selectedIntermittents.has(intermittent.id)
                        ? 'bg-primary/20 border border-primary/50'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {intermittent.avatar_url ? (
                        <img
                          src={intermittent.avatar_url}
                          alt={`${intermittent.prenom} ${intermittent.nom}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User size={18} className="text-primary" />
                        </div>
                      )}
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
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                        selectedIntermittents.has(intermittent.id)
                          ? 'bg-primary border-primary'
                          : 'border-gray-400'
                      }`}
                    >
                      {selectedIntermittents.has(intermittent.id) && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Message d'aide */}
          <p className="text-xs text-gray-400 mt-2">
            Sélectionnez jusqu'à 3 intermittents que vous recommandez pour vous remplacer.
            Le régisseur pourra choisir parmi vos suggestions ou trouver un autre remplaçant.
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !comment.trim()}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>En cours...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <UserPlus size={18} />
                <span>Envoyer la demande</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
