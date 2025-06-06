/*
  # Add avatar and bio columns to intermittent_profiles

  1. Changes
    - Add `avatar_url` column to store profile photo URL
    - Add `bio` column to store user description
    - Both columns are nullable

  2. Security
    - No changes to RLS policies needed as these columns inherit existing table policies
*/

ALTER TABLE intermittent_profiles 
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS bio text;