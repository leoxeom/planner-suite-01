/*
  # Add specialites_requises column to events table

  1. Changes
    - Add `specialites_requises` column to `events` table
      - Type: text[] (array of text)
      - Nullable: true
      - Default: empty array
      - Constraint: Values must be one of: 'son', 'lumiere', 'plateau'

  2. Security
    - No changes to RLS policies needed as the column inherits existing table policies
*/

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS specialites_requises text[] DEFAULT '{}';

-- Add check constraint to ensure only valid specialties are stored
ALTER TABLE events 
ADD CONSTRAINT events_specialites_requises_check 
CHECK (specialites_requises <@ ARRAY['son'::text, 'lumiere'::text, 'plateau'::text]);