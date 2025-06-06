import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper to get the current user's role
export const getCurrentUserRole = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // Check if user is a regisseur
    const { data: regisseur } = await supabase
      .from('regisseur_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (regisseur) return 'regisseur';
    
    // Check if user is an intermittent
    const { data: intermittent } = await supabase
      .from('intermittent_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (intermittent) return 'intermittent';
    
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};