import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Building2, Phone, Mail, MapPin, Clock, Info } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';

interface VenueInformation {
  id: string;
  nom_salle: string | null;
  telephone_salle: string | null;
  email_salle: string | null;
  acces_salle: string | null;
  heure_ouverture: string | null;
  heure_fermeture: string | null;
  adresse_salle: string | null;
  infos_pratiques: string | null;
}

const emptyVenueInformation: VenueInformation = {
  id: crypto.randomUUID(),
  nom_salle: '',
  telephone_salle: '',
  email_salle: '',
  acces_salle: '',
  heure_ouverture: '',
  heure_fermeture: '',
  adresse_salle: '',
  infos_pratiques: ''
};

export const VenueInformation: React.FC = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<VenueInformation>(emptyVenueInformation);

  useEffect(() => {
    if (user) {
      fetchVenueInformation();
    }
  }, [user]);

  const fetchVenueInformation = async () => {
    try {
      const { data, error } = await supabase
        .from('venue_information')
        .select('*')
        .eq('regisseur_id', user!.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setFormData(data);
      } else {
        // If no data exists, initialize with empty values
        setFormData({
          ...emptyVenueInformation,
          id: crypto.randomUUID() // Generate a new UUID for the new record
        });
      }
    } catch (error) {
      console.error('Error fetching venue information:', error);
      toast.error('Erreur lors du chargement des informations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const dataToSubmit = {
        ...formData,
        regisseur_id: user!.id,
      };

      const { error } = await supabase
        .from('venue_information')
        .upsert(dataToSubmit, {
          onConflict: 'regisseur_id'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Informations enregistrées avec succès');
      await fetchVenueInformation();
    } catch (error) {
      console.error('Error saving venue information:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-4xl font-display tracking-wider bg-gradient-to-r from-white to-dark-200 dark:from-white dark:to-dark-400 bg-clip-text text-transparent animate-glow-text">
          INFORMATIONS SALLE
        </h1>
        <p className="text-dark-400 font-heading">
          Gérez les informations de votre salle ou organisme
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card glass glow>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nom de la salle"
                  value={formData.nom_salle || ''}
                  onChange={(e) => setFormData({ ...formData, nom_salle: e.target.value })}
                  placeholder="Ex: Théâtre Municipal"
                  leftIcon={<Building2 size={18} />}
                />

                <Input
                  label="Téléphone"
                  value={formData.telephone_salle || ''}
                  onChange={(e) => setFormData({ ...formData, telephone_salle: e.target.value })}
                  placeholder="Ex: 01 23 45 67 89"
                  leftIcon={<Phone size={18} />}
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.email_salle || ''}
                  onChange={(e) => setFormData({ ...formData, email_salle: e.target.value })}
                  placeholder="contact@salle.fr"
                  leftIcon={<Mail size={18} />}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="time"
                    label="Heure d'ouverture"
                    value={formData.heure_ouverture || ''}
                    onChange={(e) => setFormData({ ...formData, heure_ouverture: e.target.value })}
                    leftIcon={<Clock size={18} />}
                  />

                  <Input
                    type="time"
                    label="Heure de fermeture"
                    value={formData.heure_fermeture || ''}
                    onChange={(e) => setFormData({ ...formData, heure_fermeture: e.target.value })}
                    leftIcon={<Clock size={18} />}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1.5">
                    Adresse complète
                  </label>
                  <textarea
                    value={formData.adresse_salle || ''}
                    onChange={(e) => setFormData({ ...formData, adresse_salle: e.target.value })}
                    placeholder="Numéro, rue, code postal, ville"
                    className="w-full h-24 px-4 py-2.5 rounded-lg bg-dark-900 border border-dark-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1.5">
                    Accès (transports, parking...)
                  </label>
                  <textarea
                    value={formData.acces_salle || ''}
                    onChange={(e) => setFormData({ ...formData, acces_salle: e.target.value })}
                    placeholder="Informations d'accès à la salle..."
                    className="w-full h-32 px-4 py-2.5 rounded-lg bg-dark-900 border border-dark-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1.5">
                    Informations pratiques
                  </label>
                  <textarea
                    value={formData.infos_pratiques || ''}
                    onChange={(e) => setFormData({ ...formData, infos_pratiques: e.target.value })}
                    placeholder="Autres informations utiles, liens vers des documents..."
                    className="w-full h-48 px-4 py-2.5 rounded-lg bg-dark-900 border border-dark-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={isSaving}
                  glow
                >
                  Enregistrer les Informations
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};