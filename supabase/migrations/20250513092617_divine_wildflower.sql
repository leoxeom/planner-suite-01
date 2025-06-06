/*
  # Add Teams Management Tables

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text, team name)
      - `regisseur_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
    - `team_members`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key to teams)
      - `intermittent_profile_id` (uuid, foreign key to intermittent_profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for regisseurs to manage their teams
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  regisseur_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  intermittent_profile_id uuid NOT NULL REFERENCES intermittent_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  -- Ensure each intermittent is only added once per team
  UNIQUE(team_id, intermittent_profile_id)
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Regisseurs can manage their teams"
  ON teams
  FOR ALL
  TO public
  USING (auth.uid() = regisseur_id)
  WITH CHECK (auth.uid() = regisseur_id);

CREATE POLICY "Regisseurs can read all teams"
  ON teams
  FOR SELECT
  TO public
  USING (get_current_user_role() = 'regisseur');

-- RLS Policies for team_members
CREATE POLICY "Regisseurs can manage their team members"
  ON team_members
  FOR ALL
  TO public
  USING (EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id
    AND teams.regisseur_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id
    AND teams.regisseur_id = auth.uid()
  ));

CREATE POLICY "Regisseurs can read all team members"
  ON team_members
  FOR SELECT
  TO public
  USING (get_current_user_role() = 'regisseur');