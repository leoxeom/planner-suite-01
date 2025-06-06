/*
  # Add non_retenu status to event_intermittent_assignments

  1. Changes
    - Add 'non_retenu' to the allowed values for statut_disponibilite in event_intermittent_assignments table
  
  2. Security
    - No changes to RLS policies
*/

ALTER TABLE event_intermittent_assignments 
DROP CONSTRAINT IF EXISTS event_intermittent_assignments_statut_disponibilite_check;

ALTER TABLE event_intermittent_assignments
ADD CONSTRAINT event_intermittent_assignments_statut_disponibilite_check 
CHECK (statut_disponibilite = ANY (ARRAY['propose'::text, 'disponible'::text, 'incertain'::text, 'non_disponible'::text, 'valide'::text, 'refuse'::text, 'en_attente_reponse'::text, 'non_retenu'::text]));