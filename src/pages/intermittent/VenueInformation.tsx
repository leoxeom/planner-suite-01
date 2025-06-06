import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Building2, Phone, Mail, MapPin, Clock, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../../components/ui/Card';

interface VenueInformation {
  nom_salle: string | null;
  telephone_salle: string | null;
  email_salle: string | null;
  acces_salle: string | null;
  heure_ouverture: string | null;
  heure_fermeture: string | null;
  adresse_salle: string | null;
  infos_pratiques: string | null;
}

export const VenueInformation: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [venueInfo, setVenueInfo] = useState<VenueInformation | null>(null);

  useEffect(() => {
    fetchVenueInformation();
  }, []);

  const fetchVenueInformation = async () => {
    try {
      const { data, error } = await supabase
        .from('venue_information')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setVenueInfo(data);
    } catch (error) {
      console.error('Error fetching venue information:', error);
      toast.error('Erreur lors du chargement des informations');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!venueInfo) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Card glass className="p-8 text-center">
          <p className="text-gray-400">
            Aucune information sur la salle n'est disponible pour le moment.
          </p>
        </Card>
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
          Informations pratiques sur la salle
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6"
      >
        {/* Informations Principales */}
        <Card glass glow>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Building2 size={24} className="mr-2 text-primary-400" />
              Informations Générales
            </h2>
            
            <div className="space-y-4">
              {venueInfo.nom_salle && (
                <div>
                  <h3 className="text-lg font-medium text-primary-400 mb-2">
                    {venueInfo.nom_salle}
                  </h3>
                </div>
              )}

              {venueInfo.adresse_salle && (
                <div className="flex items-start space-x-3">
                  <MapPin size={20} className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Adresse</p>
                    <p className="whitespace-pre-wrap">{venueInfo.adresse_salle}</p>
                  </div>
                </div>
              )}

              {(venueInfo.heure_ouverture || venueInfo.heure_fermeture) && (
                <div className="flex items-start space-x-3">
                  <Clock size={20} className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Horaires</p>
                    <p>
                      {venueInfo.heure_ouverture && (
                        <span>Ouverture : {venueInfo.heure_ouverture}</span>
                      )}
                      {venueInfo.heure_ouverture && venueInfo.heure_fermeture && ' - '}
                      {venueInfo.heure_fermeture && (
                        <span>Fermeture : {venueInfo.heure_fermeture}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {venueInfo.telephone_salle && (
                <div className="flex items-start space-x-3">
                  <Phone size={20} className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Téléphone</p>
                    <p>{venueInfo.telephone_salle}</p>
                  </div>
                </div>
              )}

              {venueInfo.email_salle && (
                <div className="flex items-start space-x-3">
                  <Mail size={20} className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p>{venueInfo.email_salle}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Accès */}
        {venueInfo.acces_salle && (
          <Card glass>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MapPin size={24} className="mr-2 text-primary-400" />
                Accès
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap bg-dark-900/50 p-4 rounded-lg border border-white/5">
                  {venueInfo.acces_salle}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informations Pratiques */}
        {venueInfo.infos_pratiques && (
          <Card glass>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Info size={24} className="mr-2 text-primary-400" />
                Informations Pratiques
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap bg-dark-900/50 p-4 rounded-lg border border-white/5">
                  {venueInfo.infos_pratiques}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};