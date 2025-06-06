/*
  # Add Theme Customization Columns to Regisseur Profiles

  1. Changes
    - Add `couleur_gradient_1` column with default value '#007FFF' (Electric Blue)
    - Add `couleur_gradient_2` column with default value '#F72798' (Magenta)
    - These colors will be used for the regisseur's custom theme

  2. Security
    - No changes to RLS policies needed as these columns inherit existing table policies
*/

-- Add theme customization columns if they don't exist
ALTER TABLE regisseur_profiles
ADD COLUMN IF NOT EXISTS couleur_gradient_1 text DEFAULT '#007FFF',
ADD COLUMN IF NOT EXISTS couleur_gradient_2 text DEFAULT '#F72798';