import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Types pour les profils
interface RegisseurProfile {
  id: string;
  user_id: string | null;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  organisation?: string;
  nom_organisme?: string;
  logo_path?: string;
  logo_url?: string;
  profil_complete: boolean;
}

interface IntermittentProfile {
  id: string;
  user_id: string | null;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  specialite?: string;
  bio?: string;
  photo_path?: string;
  adresse?: string;
  numero_secu?: string;
  numero_conges_spectacles?: string;
  profil_complete: boolean;
  organisme_principal_id?: string | null;
}

// Données par défaut pour éviter les crashes
const defaultRegisseurProfile: RegisseurProfile = {
  id: 'default-id',
  user_id: null,
  nom: 'Utilisateur',
  prenom: 'Nouveau',
  email: '',
  organisation: 'Organisation',
  nom_organisme: 'STAGEPLANNER',
  profil_complete: false
};

const defaultIntermittentProfile: IntermittentProfile = {
  id: 'default-id',
  user_id: null,
  nom: 'Utilisateur',
  prenom: 'Nouveau',
  email: '',
  specialite: 'Non spécifié',
  profil_complete: false,
  organisme_principal_id: null
};

// Interface du store
interface ProfileState {
  regisseurProfile: RegisseurProfile | null;
  intermittentProfile: IntermittentProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  fetchRegisseurProfile: (userId: string) => Promise<void>;
  updateRegisseurProfile: (profile: Partial<RegisseurProfile>) => Promise<void>;
  updateIntermittentProfile: (profile: Partial<IntermittentProfile>) => Promise<void>;
}

// Création du store simplifié
export const useProfileStore = create<ProfileState>((set, get) => ({
  regisseurProfile: null,
  intermittentProfile: null,
  isLoading: false,
  error: null,

  // Méthode simplifiée pour récupérer le profil
  fetchProfile: async () => {
    console.debug('[ProfileStore] Fetching profile');
    set({ isLoading: true, error: null });
    
    try {
      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.debug('[ProfileStore] No authenticated user found');
        set({ 
          isLoading: false, 
          regisseurProfile: null, 
          intermittentProfile: null 
        });
        return;
      }
      
      console.debug('[ProfileStore] User found:', user.email);
      
      // Vérifier si c'est un régisseur (version simplifiée)
      const { data: regisseurData, error: regisseurError } = await supabase
        .from('regisseur_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (regisseurData && !regisseurError) {
        console.debug('[ProfileStore] Régisseur profile found');
        set({ 
          regisseurProfile: regisseurData as RegisseurProfile, 
          intermittentProfile: null,
          isLoading: false 
        });
        return;
      }
      
      // Vérifier si c'est un intermittent (version simplifiée)
      const { data: intermittentData, error: intermittentError } = await supabase
        .from('intermittent_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (intermittentData && !intermittentError) {
        console.debug('[ProfileStore] Intermittent profile found');
        set({ 
          regisseurProfile: null, 
          intermittentProfile: intermittentData as IntermittentProfile,
          isLoading: false 
        });
        return;
      }
      
      // Si aucun profil n'est trouvé, utiliser les valeurs par défaut
      console.debug('[ProfileStore] No profile found, using defaults');
      
      // Déterminer le type d'utilisateur par défaut (basé sur les métadonnées)
      const role = user.app_metadata?.role || 'intermittent';
      
      if (role === 'regisseur') {
        set({ 
          regisseurProfile: {
            ...defaultRegisseurProfile,
            user_id: user.id,
            email: user.email || ''
          },
          intermittentProfile: null,
          isLoading: false 
        });
      } else {
        set({ 
          regisseurProfile: null,
          intermittentProfile: {
            ...defaultIntermittentProfile,
            user_id: user.id,
            email: user.email || ''
          },
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('[ProfileStore] Error fetching profile:', error);
      set({ 
        error: 'Erreur lors de la récupération du profil', 
        isLoading: false,
        // Fournir des profils par défaut pour éviter les crashes
        regisseurProfile: { ...defaultRegisseurProfile },
        intermittentProfile: null
      });
    }
  },

  // Nouvelle fonction pour récupérer le profil d'un régisseur spécifique
  fetchRegisseurProfile: async (userId) => {
    console.debug('[ProfileStore] Fetching regisseur profile for user:', userId);
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('regisseur_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('[ProfileStore] Error fetching regisseur profile:', error);
        throw error;
      }
      
      if (data) {
        console.debug('[ProfileStore] Regisseur profile found');
        set({ 
          regisseurProfile: data as RegisseurProfile, 
          isLoading: false 
        });
      } else {
        console.debug('[ProfileStore] No regisseur profile found, using defaults');
        set({ 
          regisseurProfile: {
            ...defaultRegisseurProfile,
            user_id: userId
          },
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('[ProfileStore] Error fetching regisseur profile:', error);
      set({ 
        error: 'Erreur lors de la récupération du profil régisseur', 
        isLoading: false,
        regisseurProfile: { 
          ...defaultRegisseurProfile,
          user_id: userId
        }
      });
    }
  },

  // Méthodes de mise à jour simplifiées
  updateRegisseurProfile: async (profile) => {
    console.debug('[ProfileStore] Updating regisseur profile');
    set({ isLoading: true, error: null });
    
    try {
      const currentProfile = get().regisseurProfile;
      
      if (!currentProfile?.id || currentProfile.id === 'default-id') {
        console.debug('[ProfileStore] Cannot update default profile');
        set({ isLoading: false });
        return;
      }
      
      const { error } = await supabase
        .from('regisseur_profiles')
        .update(profile)
        .eq('id', currentProfile.id);
      
      if (error) throw error;
      
      set({ 
        regisseurProfile: { ...currentProfile, ...profile },
        isLoading: false 
      });
      
      console.debug('[ProfileStore] Regisseur profile updated successfully');
    } catch (error) {
      console.error('[ProfileStore] Error updating regisseur profile:', error);
      set({ 
        error: 'Erreur lors de la mise à jour du profil', 
        isLoading: false 
      });
    }
  },

  updateIntermittentProfile: async (profile) => {
    console.debug('[ProfileStore] Updating intermittent profile');
    set({ isLoading: true, error: null });
    
    try {
      const currentProfile = get().intermittentProfile;
      
      if (!currentProfile?.id || currentProfile.id === 'default-id') {
        console.debug('[ProfileStore] Cannot update default profile');
        set({ isLoading: false });
        return;
      }
      
      const { error } = await supabase
        .from('intermittent_profiles')
        .update(profile)
        .eq('id', currentProfile.id);
      
      if (error) throw error;
      
      set({ 
        intermittentProfile: { ...currentProfile, ...profile },
        isLoading: false 
      });
      
      console.debug('[ProfileStore] Intermittent profile updated successfully');
    } catch (error) {
      console.error('[ProfileStore] Error updating intermittent profile:', error);
      set({ 
        error: 'Erreur lors de la mise à jour du profil', 
        isLoading: false 
      });
    }
  }
}));

// Initialiser le profil au démarrage de l'application
export const initializeProfile = async () => {
  console.debug('[ProfileStore] Initializing profile');
  await useProfileStore.getState().fetchProfile();
};
