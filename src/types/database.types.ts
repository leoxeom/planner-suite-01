export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// This is a placeholder type for the Database
// It should be replaced with the actual types generated from your Supabase database
export interface Database {
  public: {
    Tables: {
      regisseur_profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          full_name: string
          company_name?: string
          phone?: string
          avatar_url?: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          full_name: string
          company_name?: string
          phone?: string
          avatar_url?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          full_name?: string
          company_name?: string
          phone?: string
          avatar_url?: string
        }
      }
      intermittent_profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          full_name: string
          profession: string
          phone?: string
          avatar_url?: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          full_name: string
          profession: string
          phone?: string
          avatar_url?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          full_name?: string
          profession?: string
          phone?: string
          avatar_url?: string
        }
      }
      events: {
        Row: {
          id: string
          created_at: string
          regisseur_id: string
          title: string
          description?: string
          start_date: string
          end_date: string
          venue?: string
          status: 'draft' | 'published' | 'canceled' | 'completed'
        }
        Insert: {
          id?: string
          created_at?: string
          regisseur_id: string
          title: string
          description?: string
          start_date: string
          end_date: string
          venue?: string
          status: 'draft' | 'published' | 'canceled' | 'completed'
        }
        Update: {
          id?: string
          created_at?: string
          regisseur_id?: string
          title?: string
          description?: string
          start_date?: string
          end_date?: string
          venue?: string
          status?: 'draft' | 'published' | 'canceled' | 'completed'
        }
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}