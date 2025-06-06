/*
  # Add Profile Completion Tracking and Required Fields

  1. Changes
    - Add `profil_complete` boolean column (default false)
    - Add `avatar_url` text column for profile pictures
    - Add `bio` text column for short descriptions
    - Make critical fields required with safe defaults
  
  2. Security
    - No changes to RLS policies needed
*/

-- First, set default values for existing NULL records
UPDATE intermittent_profiles 
SET telephone = '' 
WHERE telephone IS NULL;

UPDATE intermittent_profiles 
SET adresse = '' 
WHERE adresse IS NULL;

UPDATE intermittent_profiles 
SET numero_secu = '' 
WHERE numero_secu IS NULL;

-- Add new columns
ALTER TABLE intermittent_profiles 
ADD COLUMN IF NOT EXISTS profil_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS bio text;

-- Now make fields required after ensuring no NULL values exist
ALTER TABLE intermittent_profiles
ALTER COLUMN telephone SET NOT NULL,
ALTER COLUMN adresse SET NOT NULL,
ALTER COLUMN numero_secu SET NOT NULL;