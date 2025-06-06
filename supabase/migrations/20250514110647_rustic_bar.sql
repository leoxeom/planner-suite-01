/*
  # Add organisme_principal_id to intermittent_profiles

  1. Changes
    - Add `organisme_principal_id` column to `intermittent_profiles` table
      - References the regisseur's user_id
      - Nullable: true (for intermittents not yet assigned to an organisme)
      - On Delete: SET NULL (if regisseur is deleted)

  2. Security
    - No changes to RLS policies needed as the column inherits existing table policies
*/

ALTER TABLE intermittent_profiles
ADD COLUMN IF NOT EXISTS organisme_principal_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;