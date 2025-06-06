/*
  # Add color and description to teams table

  1. Changes
    - Add `color` column to `teams` table
      - Type: text
      - Default: '#007FFF' (primary blue)
    - Add `description` column to `teams` table
      - Type: text
      - Nullable: true

  2. Security
    - No changes to RLS policies needed as the columns inherit existing table policies
*/

ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#007FFF',
ADD COLUMN IF NOT EXISTS description text;