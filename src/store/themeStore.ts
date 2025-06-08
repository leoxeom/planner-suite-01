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
  isDarkMode: boolean;
  toggleTheme: () => void;
  fetchTheme: (userId: string, role: 'regisseur' | 'intermittent') => Promise<void>;
}

// Fonction utilitaire pour convertir une couleur hexadécimale en RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  // Supprimer le # si présent
  hex = hex.replace(/^#/, '');

  // Vérifier si c'est un format valide (3 ou 6 caractères)
  if (!/^([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    console.warn(`Couleur hexadécimale invalide: ${hex}`);
    return null;
  }

  // Étendre le format court (3 caractères) au format long (6 caractères)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  // Convertir en RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b };
};

// Fonction pour appliquer les couleurs aux variables CSS
const applyColorsToCSS = (primary: string, secondary: string): void => {
  const primaryRgb = hexToRgb(primary);
  const secondaryRgb = hexToRgb(secondary);

  if (primaryRgb) {
    // Variables de couleur primaire
    document.documentElement.style.setProperty('--color-primary', primary);
    document.documentElement.style.setProperty('--color-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    document.documentElement.style.setProperty('--color-primary-50', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.05)`);
    document.documentElement.style.setProperty('--color-primary-100', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`);
    document.documentElement.style.setProperty('--color-primary-200', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)`);
    document.documentElement.style.setProperty('--color-primary-300', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3)`);
    document.documentElement.style.setProperty('--color-primary-400', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.4)`);
    document.documentElement.style.setProperty('--color-primary-500', primary);
    document.documentElement.style.setProperty('--color-primary-600', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.6)`);
    document.documentElement.style.setProperty('--color-primary-700', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.7)`);
    document.documentElement.style.setProperty('--color-primary-800', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8)`);
    document.documentElement.style.setProperty('--color-primary-900', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.9)`);
  }

  if (secondaryRgb) {
    // Variables de couleur secondaire
    document.documentElement.style.setProperty('--color-secondary', secondary);
    document.documentElement.style.setProperty('--color-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
    document.documentElement.style.setProperty('--color-secondary-50', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.05)`);
    document.documentElement.style.setProperty('--color-secondary-100', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.1)`);
    document.documentElement.style.setProperty('--color-secondary-200', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.2)`);
    document.documentElement.style.setProperty('--color-secondary-300', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.3)`);
    document.documentElement.style.setProperty('--color-secondary-400', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.4)`);
    document.documentElement.style.setProperty('--color-secondary-500', secondary);
    document.documentElement.style.setProperty('--color-secondary-600', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.6)`);
    document.documentElement.style.setProperty('--color-secondary-700', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.7)`);
    document.documentElement.style.setProperty('--color-secondary-800', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.8)`);
    document.documentElement.style.setProperty('--color-secondary-900', `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.9)`);
  }

  // Variables pour les composants UI
  document.documentElement.style.setProperty('--color-button-primary-bg', primary);
  document.documentElement.style.setProperty('--color-button-primary-text', '#ffffff');
  document.documentElement.style.setProperty('--color-button-secondary-bg', secondary);
  document.documentElement.style.setProperty('--color-button-secondary-text', '#ffffff');
  document.documentElement.style.setProperty('--color-input-focus-ring', `rgba(${primaryRgb?.r || 0}, ${primaryRgb?.g || 127}, ${primaryRgb?.b || 255}, 0.25)`);
  document.documentElement.style.setProperty('--color-link', primary);
  document.documentElement.style.setProperty('--color-link-hover', secondary);
};

// Fonction pour détecter la préférence système pour le dark mode
const getSystemPreference = (): boolean => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Fonction pour appliquer le dark mode au document
const applyDarkMode = (isDark: boolean): void => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => {
  // Récupération de la préférence depuis localStorage ou utilisation de la préférence système
  const storedPreference = localStorage.getItem('darkMode');
  const initialDarkMode = storedPreference !== null 
    ? storedPreference === 'true' 
    : getSystemPreference();
  
  // Appliquer le mode initial
  applyDarkMode(initialDarkMode);
  
  return {
    colors: {
      primary: '#007FFF',
      secondary: '#F72798'
    },
    borderRadius: 12,
    organizationName: null,
    logoUrl: null,
    isLoading: false,
    error: null,
    isDarkMode: initialDarkMode,

    toggleTheme: () => {
      const newDarkMode = !get().isDarkMode;
      
      // Appliquer le nouveau mode
      applyDarkMode(newDarkMode);
      
      // Sauvegarder la préférence
      localStorage.setItem('darkMode', String(newDarkMode));
      
      // Mettre à jour l'état
      set({ isDarkMode: newDarkMode });
    },

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
          // Appliquer le thème aux variables CSS avec la nouvelle fonction
          applyColorsToCSS(
            themeData.couleur_gradient_1,
            themeData.couleur_gradient_2
          );
          
          // Appliquer le border radius
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
          // Utiliser le thème par défaut
          applyColorsToCSS('#007FFF', '#F72798');
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
  };
});
