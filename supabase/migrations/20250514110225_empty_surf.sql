/*
  # Add Border Radius Customization

  1. Changes
    - Add `global_border_radius` column to `regisseur_profiles` table
      - Type: integer
      - Default: 12 (pixels)
      - Nullable: false
*/

ALTER TABLE regisseur_profiles
ADD COLUMN IF NOT EXISTS global_border_radius integer NOT NULL DEFAULT 12;