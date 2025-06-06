import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Copy, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';

interface MessageTemplate {
  id: string;
  type_email: string;
  sujet_email: string;
  contenu_email_html: string;
}

const EMAIL_TYPES = [
  { value: 'creation_compte_intermittent', label: 'Création de Compte Intermittent' },
  { value: 'proposition_dates', label: 'Proposition de Dates' },
  { value: 'relance_disponibilites', label: 'Relance Disponibilités' },
  { value: 'confirmation_dates', label: 'Confirmation de Dates' },
  { value: 'rappel_visite_medicale', label: 'Rappel Visite Médicale' }
];

export const MessageTemplates: React.FC = () => {
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [formData, setFormData] = useState({
    type_email: '',
    sujet_email: '',
    contenu_email_html: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('regisseur_id', user!.id)
        .order('type_email', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erreur lors du chargement des modèles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type_email || !formData.sujet_email || !formData.contenu_email_html) {
      toast.error('Tous les champs sont requis');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            type_email: formData.type_email,
            sujet_email: formData.sujet_email,
            contenu_email_html: formData.contenu_email_html
          })
          .eq('id', editingTemplate.id)
          .eq('regisseur_id', user!.id);

        if (error) throw error;
        toast.success('Modèle mis à jour avec succès');
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert({
            regisseur_id: user!.id,
            type_email: formData.type_email,
            sujet_email: formData.sujet_email,
            contenu_email_html: formData.contenu_email_html
          });

        if (error) {
          if (error.code === '23505') {
            toast.error('Un modèle de ce type existe déjà');
            return;
          }
          throw error;
        }
        toast.success('Modèle créé avec succès');
      }

      await fetchTemplates();
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erreur lors de la sauvegarde du modèle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id)
        .eq('regisseur_id', user!.id);

      if (error) throw error;
      toast.success('Modèle supprimé avec succès');
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erreur lors de la suppression du modèle');
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      type_email: template.type_email,
      sujet_email: template.sujet_email,
      contenu_email_html: template.contenu_email_html
    });
    setShowForm(true);
  };

  const handleCopy = async (template: MessageTemplate) => {
    try {
      await navigator.clipboard.writeText(template.contenu_email_html);
      toast.success('Contenu copié dans le presse-papiers');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Erreur lors de la copie du contenu');
    }
  };

  const resetForm = () => {
    setFormData({
      type_email: '',
      sujet_email: '',
      contenu_email_html: ''
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-4xl font-display tracking-wider bg-gradient-to-r from-white to-dark-200 dark:from-white dark:to-dark-400 bg-clip-text text-transparent animate-glow-text">
            MODÈLES DE MESSAGES
          </h1>
          <p className="text-dark-400 font-heading">
            Gérez vos modèles de messages pour les intermittents
          </p>
        </motion.div>

        {!showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button
              onClick={() => setShowForm(true)}
              leftIcon={<Plus className="w-5 h-5" />}
              theme="stage"
              glow
            >
              NOUVEAU MODÈLE
            </Button>
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card glass glow>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                      {editingTemplate ? 'Modifier le modèle' : 'Nouveau modèle'}
                    </h2>
                    <Button
                      variant="ghost"
                      onClick={resetForm}
                      leftIcon={<X size={18} />}
                    >
                      Annuler
                    </Button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1.5">
                      Type de message <span className="text-error-500">*</span>
                    </label>
                    <select
                      value={formData.type_email}
                      onChange={(e) => setFormData({ ...formData, type_email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-dark-900 border border-dark-700 text-white"
                      required
                    >
                      <option value="">Sélectionner un type</option>
                      {EMAIL_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Titre du modèle"
                    value={formData.sujet_email}
                    onChange={(e) => setFormData({ ...formData, sujet_email: e.target.value })}
                    placeholder="Ex: Proposition de dates pour &#123;&#123;nom_evenement&#125;&#125;"
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1.5">
                      Contenu du message <span className="text-error-500">*</span>
                    </label>
                    <textarea
                      value={formData.contenu_email_html}
                      onChange={(e) => setFormData({ ...formData, contenu_email_html: e.target.value })}
                      className="w-full h-64 px-4 py-2.5 rounded-lg bg-dark-900 border border-dark-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Écrivez votre message ici..."
                      required
                    />
                    <p className="mt-2 text-sm text-gray-400">
                      Balises disponibles : &#123;&#123;nom_intermittent&#125;&#125;, &#123;&#123;prenom_intermittent&#125;&#125;, &#123;&#123;email_intermittent&#125;&#125;, &#123;&#123;nom_evenement&#125;&#125;, &#123;&#123;date_debut_evenement&#125;&#125;
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={isSubmitting}
                    leftIcon={<Save size={18} />}
                    glow
                  >
                    {editingTemplate ? 'Mettre à jour' : 'Créer le modèle'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-6"
          >
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : templates.length > 0 ? (
              templates.map((template) => (
                <Card
                  key={template.id}
                  glass
                  className="group hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold group-hover:text-primary-400 transition-colors">
                          {template.sujet_email}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {EMAIL_TYPES.find(t => t.value === template.type_email)?.label}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleCopy(template)}
                          leftIcon={<Copy size={18} />}
                        >
                          Copier
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleEdit(template)}
                          leftIcon={<Pencil size={18} />}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleDelete(template.id)}
                          leftIcon={<Trash2 size={18} className="text-error-500" />}
                          className="text-error-500 hover:bg-error-500/10"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm bg-dark-900/50 p-4 rounded-lg border border-white/5">
                      {template.contenu_email_html}
                    </pre>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card glass className="text-center py-12">
                <p className="text-gray-400">
                  Aucun modèle de message créé
                </p>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};