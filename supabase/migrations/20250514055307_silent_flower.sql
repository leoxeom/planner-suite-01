/*
  # Add avatar and bio columns to intermittent_profiles

  1. Changes
    - Add `avatar_url` column to store the URL of the uploaded avatar
    - Add `bio` column to store the intermittent's description/biography
*/

ALTER TABLE intermittent_profiles 
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS bio text;