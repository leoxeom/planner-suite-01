import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface RegisseurProfile {
  nom_organisme: string | null;
  logo_url: string | null;
  couleur_gradient_1: string;
  couleur_gradient_2: string;
}

interface ProfileState {
  regisseurProfile: RegisseurProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchRegisseurProfile: (userId: string) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  regisseurProfile: null,
  isLoading: false,
  error: null,
  
  fetchRegisseurProfile: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('regisseur_profiles')
        .select('nom_organisme, logo_url, couleur_gradient_1, couleur_gradient_2')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Apply theme colors
        document.documentElement.style.setProperty('--color-primary', data.couleur_gradient_1 || '#007FFF');
        document.documentElement.style.setProperty('--color-secondary', data.couleur_gradient_2 || '#F72798');
        
        set({ regisseurProfile: data, isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching regisseur profile:', error);
      set({ 
        error: 'Failed to load profile', 
        isLoading: false 
      });
    }
  },
}));