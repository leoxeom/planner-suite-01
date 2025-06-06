import { create } from 'zustand';
import { UserRole, UserSession } from '../types/auth.types';
import { supabase } from '../lib/supabase';

interface AuthState extends UserSession {
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
  signUp: (
    email: string, 
    password: string, 
    userData: { 
      role: UserRole; 
      fullName: string; 
      profession?: string; 
      companyName?: string;
    }
  ) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
  signOut: () => Promise<void>;
  getUserRole: () => Promise<UserRole | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Create a custom error object with the Supabase error message
        const customError = new Error(error.message);
        throw customError;
      }

      if (data.user) {
        // Get role from user metadata
        const role = data.user.user_metadata?.role as UserRole;
        
        set({ 
          user: { 
            ...data.user, 
            role 
          },
          isLoading: false
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { 
        data: null, 
        error: error as Error 
      };
    }
  },

  signUp: async (email, password, userData) => {
    try {
      // Only allow intermittent signups through the application
      if (userData.role === 'regisseur') {
        throw new Error('Unauthorized registration attempt');
      }

      // Sign up the user with role in metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'intermittent', // Always set to intermittent for app signups
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create intermittent profile
        const { error: profileError } = await supabase
          .from('intermittent_profiles')
          .insert({
            user_id: data.user.id,
            nom: userData.fullName.split(' ')[1] || '',
            prenom: userData.fullName.split(' ')[0] || '',
            email: email,
            specialite: userData.profession,
          });

        if (profileError) throw profileError;

        set({ 
          user: { 
            ...data.user, 
            role: 'intermittent'
          },
          isLoading: false
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error: error as Error };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isLoading: false });
  },

  getUserRole: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.user_metadata?.role as UserRole || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }
}));

// Initialize: check if user is already logged in
export const initializeAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Get role from user metadata
      const role = session.user.user_metadata?.role as UserRole;
      
      useAuthStore.setState({ 
        user: { 
          ...session.user, 
          role 
        }, 
        isLoading: false 
      });
    } else {
      useAuthStore.setState({ user: null, isLoading: false });
    }
  } catch (error) {
    console.error('Error checking auth session:', error);
    useAuthStore.setState({ user: null, isLoading: false });
  }
};