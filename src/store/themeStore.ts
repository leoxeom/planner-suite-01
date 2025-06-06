import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface ThemeState {
  colors: {
    primary: string;
    secondary: string;
  };
  borderRadius: number;
  organizationName: string | null;
  logoUrl: string | null;
  isLoading: boolean;
  error: string | null;
  fetchTheme: (userId: string, role: 'regisseur' | 'intermittent') => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  colors: {
    primary: '#007FFF',
    secondary: '#F72798'
  },
  borderRadius: 12,
  organizationName: null,
  logoUrl: null,
  isLoading: false,
  error: null,

  fetchTheme: async (userId: string, role: 'regisseur' | 'intermittent') => {
    set({ isLoading: true, error: null });

    try {
      let themeData;

      if (role === 'regisseur') {
        // Fetch regisseur's own theme
        const { data, error } = await supabase
          .from('regisseur_profiles')
          .select('nom_organisme, logo_url, couleur_gradient_1, couleur_gradient_2, global_border_radius')
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        themeData = data;
      } else {
        // For intermittents, first get their organisme_principal_id
        const { data: intermittentData, error: intermittentError } = await supabase
          .from('intermittent_profiles')
          .select('organisme_principal_id')
          .eq('user_id', userId)
          .single();

        if (intermittentError) throw intermittentError;

        if (intermittentData?.organisme_principal_id) {
          // Then fetch the regisseur's theme
          const { data, error } = await supabase
            .from('regisseur_profiles')
            .select('nom_organisme, logo_url, couleur_gradient_1, couleur_gradient_2, global_border_radius')
            .eq('user_id', intermittentData.organisme_principal_id)
            .single();

          if (error) throw error;
          themeData = data;
        }
      }

      if (themeData) {
        // Apply theme to CSS variables
        document.documentElement.style.setProperty('--color-primary', themeData.couleur_gradient_1);
        document.documentElement.style.setProperty('--color-secondary', themeData.couleur_gradient_2);
        document.documentElement.style.setProperty('--global-border-radius', `${themeData.global_border_radius}px`);

        set({
          colors: {
            primary: themeData.couleur_gradient_1,
            secondary: themeData.couleur_gradient_2
          },
          borderRadius: themeData.global_border_radius,
          organizationName: themeData.nom_organisme,
          logoUrl: themeData.logo_url,
          isLoading: false
        });
      } else {
        // Use default theme
        document.documentElement.style.setProperty('--color-primary', '#007FFF');
        document.documentElement.style.setProperty('--color-secondary', '#F72798');
        document.documentElement.style.setProperty('--global-border-radius', '12px');

        set({
          colors: {
            primary: '#007FFF',
            secondary: '#F72798'
          },
          borderRadius: 12,
          organizationName: null,
          logoUrl: null,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error fetching theme:', error);
      set({ error: 'Failed to load theme', isLoading: false });
    }
  }
}));