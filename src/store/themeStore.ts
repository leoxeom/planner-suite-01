import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types pour le thème
interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  card: string;
  border: string;
}

export interface Theme {
  name: string;
  isDark: boolean;
  colors: ThemeColors;
  logoPath?: string;
  organisation?: string;
}

interface ThemeState {
  currentTheme: Theme;
  isDarkMode: boolean;
  isLoading: boolean;
  error: string | null;
  setDarkMode: (isDark: boolean) => void;
  setTheme: (theme: Theme) => void;
  resetToDefault: () => void;
}

// Thèmes par défaut
const defaultLightTheme: Theme = {
  name: 'Default Light',
  isDark: false,
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#8b5cf6',
    background: '#f8fafc',
    text: '#1e293b',
    card: '#ffffff',
    border: '#e2e8f0'
  }
};

const defaultDarkTheme: Theme = {
  name: 'Default Dark',
  isDark: true,
  colors: {
    primary: '#60a5fa',
    secondary: '#34d399',
    accent: '#a78bfa',
    background: '#0f172a',
    text: '#f1f5f9',
    card: '#1e293b',
    border: '#334155'
  }
};

// Store de thème simplifié sans requêtes Supabase
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: defaultLightTheme,
      isDarkMode: false,
      isLoading: false,
      error: null,

      setDarkMode: (isDark: boolean) => {
        console.debug('[ThemeStore] Changing theme mode to:', isDark ? 'dark' : 'light');
        const newTheme = isDark ? defaultDarkTheme : defaultLightTheme;
        set({ 
          isDarkMode: isDark,
          currentTheme: newTheme
        });
        
        // Appliquer la classe au document pour le thème global
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      setTheme: (theme: Theme) => {
        console.debug('[ThemeStore] Setting custom theme:', theme.name);
        set({ currentTheme: theme });
      },

      resetToDefault: () => {
        console.debug('[ThemeStore] Resetting to default theme');
        const isDark = get().isDarkMode;
        set({ 
          currentTheme: isDark ? defaultDarkTheme : defaultLightTheme,
          error: null
        });
      }
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ 
        isDarkMode: state.isDarkMode,
        // Ne pas persister les erreurs ou l'état de chargement
        currentTheme: state.currentTheme
      }),
      onRehydrateStorage: () => {
        console.debug('[ThemeStore] Hydrating theme from storage');
        return (state) => {
          if (state) {
            console.debug('[ThemeStore] Theme hydrated:', state.isDarkMode ? 'dark' : 'light');
            // Appliquer la classe dark au document si nécessaire
            if (state.isDarkMode) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
        };
      }
    }
  )
);

// Initialiser le thème au démarrage de l'application
export const initializeTheme = () => {
  console.debug('[ThemeStore] Initializing theme');
  
  // Vérifier la préférence système pour le mode sombre
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  console.debug('[ThemeStore] System prefers dark mode:', prefersDark);
  
  // Si le thème n'est pas déjà défini dans le store, utiliser la préférence système
  const { isDarkMode, setDarkMode } = useThemeStore.getState();
  
  if (isDarkMode === undefined) {
    setDarkMode(prefersDark);
  } else {
    // S'assurer que la classe dark est correctement appliquée
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};
