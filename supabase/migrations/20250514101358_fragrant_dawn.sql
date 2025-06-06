/*
  # Create Venue Information Table

  1. New Table
    - `venue_information` table for storing venue/organization details
    - One-to-one relationship with regisseur
    - Includes basic venue information and operating hours
  
  2. Security
    - Enable RLS
    - Regisseurs can manage their own venue information
    - Authenticated users can view venue information
*/

-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS venue_information CASCADE;

-- Create venue_information table
CREATE TABLE venue_information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regisseur_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_salle text,
  telephone_salle text,
  email_salle text,
  acces_salle text,
  heure_ouverture time without time zone,
  heure_fermeture time without time zone,
  adresse_salle text,
  infos_pratiques text,
  documents_techniques jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  -- Ensure each regisseur can only have one venue information entry
  UNIQUE(regisseur_id)
);

-- Add updated_at trigger
CREATE TRIGGER set_timestamp_venue_information
  BEFORE UPDATE ON venue_information
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Enable RLS
ALTER TABLE venue_information ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Les régisseurs peuvent gérer les informations de leur salle"
  ON venue_information
  FOR ALL
  TO public
  USING (auth.uid() = regisseur_id AND get_current_user_role() = 'regisseur')
  WITH CHECK (auth.uid() = regisseur_id AND get_current_user_role() = 'regisseur');

CREATE POLICY "Les utilisateurs authentifiés peuvent voir les informations de la salle"
  ON venue_information
  FOR SELECT
  TO public
  USING (auth.role() = 'authenticated');