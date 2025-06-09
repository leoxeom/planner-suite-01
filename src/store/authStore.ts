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
  refreshSession: () => Promise<boolean>;
  sessionStatus: 'active' | 'expired' | 'refreshing' | 'unknown';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  sessionStatus: 'unknown',

  signIn: async (email, password) => {
    try {
      console.debug('[Auth] Attempting sign in for:', email);
      set({ isLoading: true });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Sign in error:', error.message);
        // Create a custom error object with the Supabase error message
        const customError = new Error(error.message);
        throw customError;
      }

      if (data.user) {
        // Get role from user metadata
        const role = data.user.user_metadata?.role as UserRole;
        console.debug('[Auth] Sign in successful. User role:', role);
        
        set({ 
          user: { 
            ...data.user, 
            role 
          },
          isLoading: false,
          sessionStatus: 'active'
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error('[Auth] Error signing in:', error);
      set({ isLoading: false });
      return { 
        data: null, 
        error: error as Error 
      };
    }
  },

  signUp: async (email, password, userData) => {
    try {
      console.debug('[Auth] Attempting sign up for:', email);
      set({ isLoading: true });
      
      // Only allow intermittent signups through the application
      if (userData.role === 'regisseur') {
        console.warn('[Auth] Unauthorized registration attempt for regisseur role');
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
        console.debug('[Auth] User created successfully, creating profile');
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
          isLoading: false,
          sessionStatus: 'active'
        });
        
        console.debug('[Auth] Sign up and profile creation successful');
      }

      return { data, error: null };
    } catch (error) {
      console.error('[Auth] Error signing up:', error);
      set({ isLoading: false });
      return { data: null, error: error as Error };
    }
  },

  signOut: async () => {
    console.debug('[Auth] Signing out user');
    await supabase.auth.signOut();
    set({ user: null, isLoading: false, sessionStatus: 'unknown' });
    console.debug('[Auth] User signed out successfully');
  },

  getUserRole: async () => {
    try {
      console.debug('[Auth] Getting user role');
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role as UserRole || null;
      console.debug('[Auth] User role retrieved:', role);
      return role;
    } catch (error) {
      console.error('[Auth] Error getting user role:', error);
      return null;
    }
  },
  
  refreshSession: async () => {
    try {
      console.debug('[Auth] Attempting to refresh session');
      set({ sessionStatus: 'refreshing' });
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[Auth] Session refresh failed:', error.message);
        set({ sessionStatus: 'expired' });
        return false;
      }
      
      if (data.session) {
        console.debug('[Auth] Session refreshed successfully');
        const role = data.user?.user_metadata?.role as UserRole;
        
        set({ 
          user: data.user ? { ...data.user, role } : null,
          sessionStatus: 'active',
          isLoading: false
        });
        
        return true;
      } else {
        console.warn('[Auth] No session returned after refresh');
        set({ sessionStatus: 'expired' });
        return false;
      }
    } catch (error) {
      console.error('[Auth] Error refreshing session:', error);
      set({ sessionStatus: 'expired' });
      return false;
    }
  }
}));

// Initialize: check if user is already logged in and setup auth state change listener
export const initializeAuth = async () => {
  try {
    console.debug('[Auth] Initializing authentication');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Get role from user metadata
      const role = session.user.user_metadata?.role as UserRole;
      console.debug('[Auth] Existing session found. User role:', role);
      
      useAuthStore.setState({ 
        user: { 
          ...session.user, 
          role 
        }, 
        isLoading: false,
        sessionStatus: 'active'
      });
    } else {
      console.debug('[Auth] No active session found');
      useAuthStore.setState({ user: null, isLoading: false, sessionStatus: 'expired' });
    }
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.debug('[Auth] Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          const role = session.user.user_metadata?.role as UserRole;
          console.debug('[Auth] User signed in. Role:', role);
          
          useAuthStore.setState({
            user: {
              ...session.user,
              role
            },
            isLoading: false,
            sessionStatus: 'active'
          });
        } else if (event === 'SIGNED_OUT') {
          console.debug('[Auth] User signed out');
          useAuthStore.setState({ user: null, isLoading: false, sessionStatus: 'expired' });
        } else if (event === 'TOKEN_REFRESHED') {
          console.debug('[Auth] Token refreshed automatically');
          if (session) {
            const role = session.user.user_metadata?.role as UserRole;
            useAuthStore.setState({
              user: {
                ...session.user,
                role
              },
              sessionStatus: 'active'
            });
          }
        } else if (event === 'USER_UPDATED') {
          console.debug('[Auth] User data updated');
          if (session) {
            const role = session.user.user_metadata?.role as UserRole;
            useAuthStore.setState({
              user: {
                ...session.user,
                role
              }
            });
          }
        }
      }
    );
    
    // Cleanup function will be called when the app unmounts
    return () => {
      console.debug('[Auth] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('[Auth] Error initializing auth:', error);
    useAuthStore.setState({ user: null, isLoading: false, sessionStatus: 'unknown' });
  }
};

// Function to check session status periodically (can be called from App.tsx)
export const setupSessionRefreshInterval = (intervalMinutes = 15) => {
  console.debug(`[Auth] Setting up session refresh interval (${intervalMinutes} minutes)`);
  const interval = setInterval(async () => {
    const { sessionStatus, user, refreshSession } = useAuthStore.getState();
    
    if (user && sessionStatus !== 'refreshing') {
      console.debug('[Auth] Performing periodic session check');
      await refreshSession();
    }
  }, intervalMinutes * 60 * 1000);
  
  return () => {
    console.debug('[Auth] Clearing session refresh interval');
    clearInterval(interval);
  };
};
