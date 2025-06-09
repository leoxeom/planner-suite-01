import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { IntermittentProfile, RegisseurProfile, UserRole } from '../types/database.types';

interface ProfileState {
  // États
  regisseurProfile: RegisseurProfile | null;
  intermittentProfile: IntermittentProfile | null;
  loading: boolean;
  error: string | null;
  userRole: UserRole | null;
  
  // Actions
  fetchProfile: () => Promise<void>;
  fetchRegisseurProfile: (userId: string) => Promise<RegisseurProfile | null>;
  fetchIntermittentProfile: (userId: string) => Promise<IntermittentProfile | null>;
  getUserRole: () => Promise<UserRole | null>;
  updateRegisseurProfile: (profile: Partial<RegisseurProfile>) => Promise<void>;
  updateIntermittentProfile: (profile: Partial<IntermittentProfile>) => Promise<void>;
  clearProfile: () => void;
  setError: (error: string | null) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  regisseurProfile: null,
  intermittentProfile: null,
  loading: false,
  error: null,
  userRole: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ loading: false, error: 'Utilisateur non connecté' });
        return;
      }
      
      // Essayer de récupérer le profil régisseur
      const { data: regisseurData, error: regisseurError } = await supabase
        .from('regisseur_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (regisseurData && !regisseurError) {
        set({ 
          regisseurProfile: regisseurData as RegisseurProfile, 
          intermittentProfile: null,
          userRole: 'regisseur',
          loading: false 
        });
        return;
      }
      
      // Si pas de profil régisseur, essayer de récupérer le profil intermittent
      const { data: intermittentData, error: intermittentError } = await supabase
        .from('intermittent_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (intermittentData && !intermittentError) {
        set({ 
          intermittentProfile: intermittentData as IntermittentProfile, 
          regisseurProfile: null,
          userRole: 'intermittent',
          loading: false 
        });
        return;
      }
      
      // Si aucun profil n'est trouvé
      set({ 
        loading: false, 
        error: 'Aucun profil trouvé pour cet utilisateur',
        regisseurProfile: null,
        intermittentProfile: null
      });
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération du profil' 
      });
    }
  },
  
  fetchRegisseurProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('regisseur_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data as RegisseurProfile;
    } catch (error) {
      console.error('Error fetching regisseur profile:', error);
      return null;
    }
  },
  
  fetchIntermittentProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('intermittent_profiles')
        .select('id, nom, prenom, email, specialite, profil_complete, organisme_principal_id')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data as IntermittentProfile;
    } catch (error) {
      console.error('Error fetching intermittent profile:', error);
      return null;
    }
  },
  
  getUserRole: async () => {
    // Si le rôle est déjà en cache, le retourner
    if (get().userRole) return get().userRole;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // Vérifier d'abord si c'est un régisseur
      const { data: regisseurData } = await supabase
        .from('regisseur_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (regisseurData) {
        set({ userRole: 'regisseur' });
        return 'regisseur' as UserRole;
      }
      
      // Sinon vérifier si c'est un intermittent
      const { data: intermittentData } = await supabase
        .from('intermittent_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (intermittentData) {
        set({ userRole: 'intermittent' });
        return 'intermittent' as UserRole;
      }
      
      // Si aucun profil n'est trouvé
      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },
  
  updateRegisseurProfile: async (profile: Partial<RegisseurProfile>) => {
    set({ loading: true, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');
      
      const currentProfile = get().regisseurProfile;
      if (!currentProfile) throw new Error('Aucun profil régisseur trouvé');
      
      const { error } = await supabase
        .from('regisseur_profiles')
        .update({ 
          ...profile, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', currentProfile.id);
      
      if (error) throw error;
      
      // Mettre à jour le profil en local
      set({ 
        regisseurProfile: { ...currentProfile, ...profile } as RegisseurProfile,
        loading: false 
      });
    } catch (error) {
      console.error('Error updating regisseur profile:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil' 
      });
    }
  },
  
  updateIntermittentProfile: async (profile: Partial<IntermittentProfile>) => {
    set({ loading: true, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');
      
      const currentProfile = get().intermittentProfile;
      if (!currentProfile) throw new Error('Aucun profil intermittent trouvé');
      
      const { error } = await supabase
        .from('intermittent_profiles')
        .update({ 
          ...profile, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', currentProfile.id);
      
      if (error) throw error;
      
      // Mettre à jour le profil en local
      set({ 
        intermittentProfile: { ...currentProfile, ...profile } as IntermittentProfile,
        loading: false 
      });
    } catch (error) {
      console.error('Error updating intermittent profile:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil' 
      });
    }
  },
  
  clearProfile: () => {
    set({ 
      regisseurProfile: null, 
      intermittentProfile: null,
      userRole: null,
      error: null 
    });
  },
  
  setError: (error: string | null) => {
    set({ error });
  }
}));
