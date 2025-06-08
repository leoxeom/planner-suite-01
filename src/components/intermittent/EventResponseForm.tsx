import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Check, X, Calendar, PlusCircle, Trash2, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

interface EventResponseFormProps {
  eventId: string;
  assignmentId: string;
  eventName: string;
  eventDate: string;
  onResponseSubmitted: () => void;
  onCancel: () => void;
}

type ResponseType = 'accept' | 'refuse' | 'propose_alternative';

export const EventResponseForm: React.FC<EventResponseFormProps> = ({
  eventId,
  assignmentId,
  eventName,
  eventDate,
  onResponseSubmitted,
  onCancel
}) => {
  const [selectedResponse, setSelectedResponse] = useState<ResponseType | null>(null);
  const [comment, setComment] = useState('');
  const [alternativeDates, setAlternativeDates] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentField, setShowCommentField] = useState(false);

  const handleAddAlternativeDate = () => {
    setAlternativeDates([...alternativeDates, '']);
  };

  const handleRemoveAlternativeDate = (index: number) => {
    const newDates = [...alternativeDates];
    newDates.splice(index, 1);
    setAlternativeDates(newDates);
  };

  const handleAlternativeDateChange = (index: number, value: string) => {
    const newDates = [...alternativeDates];
    newDates[index] = value;
    setAlternativeDates(newDates);
  };

  const validateForm = () => {
    if (!selectedResponse) {
      toast.error('Veuillez sélectionner une réponse');
      return false;
    }

    if (selectedResponse === 'propose_alternative') {
      // Vérifier que toutes les dates alternatives sont remplies
      const validDates = alternativeDates.filter(date => date.trim() !== '');
      if (validDates.length === 0) {
        toast.error('Veuillez proposer au moins une date alternative');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      // Préparer les dates alternatives si nécessaire
      let formattedAlternativeDates: string[] = [];
      if (selectedResponse === 'propose_alternative') {
        formattedAlternativeDates = alternativeDates.filter(date => date.trim() !== '');
      }

      // Insérer la réponse dans la base de données
      const { data, error } = await supabase
        .from('event_intermittent_responses')
        .insert({
          event_assignment_id: assignmentId,
          response_type: selectedResponse,
          comment: comment.trim() !== '' ? comment : null,
          alternative_dates: formattedAlternativeDates.length > 0 ? formattedAlternativeDates : null
        });

      if (error) throw error;

      toast.success('Votre réponse a été enregistrée avec succès');
      onResponseSubmitted();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Une erreur est survenue lors de l\'enregistrement de votre réponse');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatage de la date pour l'affichage
  const formattedDate = () => {
    try {
      return format(new Date(eventDate), 'PPPP', { locale: fr });
    } catch (e) {
      return eventDate;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Répondre à la proposition</h3>
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
        <p className="text-gray-300">{formattedDate()}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Options de réponse */}
        <div className="space-y-3">
          <p className="font-medium mb-2">Votre réponse :</p>

          {/* Option Accepter */}
          <button
            type="button"
            onClick={() => setSelectedResponse('accept')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
              selectedResponse === 'accept'
                ? 'bg-green-900/20 border-green-500/50 shadow-lg shadow-green-500/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                selectedResponse === 'accept' ? 'bg-green-500/20' : 'bg-white/5'
              }`}>
                <Check size={20} className={selectedResponse === 'accept' ? 'text-green-400' : ''} />
              </div>
              <span>J'accepte cette date</span>
            </div>
            {selectedResponse === 'accept' && <Check size={18} className="text-green-400" />}
          </button>

          {/* Option Refuser */}
          <button
            type="button"
            onClick={() => setSelectedResponse('refuse')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
              selectedResponse === 'refuse'
                ? 'bg-red-900/20 border-red-500/50 shadow-lg shadow-red-500/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                selectedResponse === 'refuse' ? 'bg-red-500/20' : 'bg-white/5'
              }`}>
                <X size={20} className={selectedResponse === 'refuse' ? 'text-red-400' : ''} />
              </div>
              <span>Je ne suis pas disponible</span>
            </div>
            {selectedResponse === 'refuse' && <Check size={18} className="text-red-400" />}
          </button>

          {/* Option Proposer d'autres dates */}
          <button
            type="button"
            onClick={() => setSelectedResponse('propose_alternative')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
              selectedResponse === 'propose_alternative'
                ? 'bg-blue-900/20 border-blue-500/50 shadow-lg shadow-blue-500/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                selectedResponse === 'propose_alternative' ? 'bg-blue-500/20' : 'bg-white/5'
              }`}>
                <Calendar size={20} className={selectedResponse === 'propose_alternative' ? 'text-blue-400' : ''} />
              </div>
              <span>Je propose d'autres dates</span>
            </div>
            {selectedResponse === 'propose_alternative' && <Check size={18} className="text-blue-400" />}
          </button>
        </div>

        {/* Dates alternatives */}
        <AnimatePresence>
          {selectedResponse === 'propose_alternative' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 overflow-hidden"
            >
              <p className="font-medium">Proposer des dates alternatives :</p>
              
              {alternativeDates.map((date, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => handleAlternativeDateChange(index, e.target.value)}
                    className="flex-grow p-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  {alternativeDates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAlternativeDate(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddAlternativeDate}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <PlusCircle size={18} />
                <span>Ajouter une autre date</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton pour afficher/masquer le champ de commentaire */}
        <button
          type="button"
          onClick={() => setShowCommentField(!showCommentField)}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <MessageCircle size={18} />
          <span>
            {showCommentField ? 'Masquer le commentaire' : 'Ajouter un commentaire'}
          </span>
        </button>

        {/* Champ de commentaire */}
        <AnimatePresence>
          {showCommentField && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Commentaire (optionnel)"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                rows={4}
              />
            </motion.div>
          )}
        </AnimatePresence>

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
            type="submit"
            variant="primary"
            disabled={isSubmitting || !selectedResponse}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>En cours...</span>
              </div>
            ) : (
              <span>Envoyer ma réponse</span>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
