/*
  # Create Replacement Requests Table and Policies

  1. New Table
    - `replacement_requests` for storing replacement requests from intermittents
    - Tracks request type, status, suggested replacements, and comments
    - Links to events, intermittents, and regisseurs

  2. Security
    - Enable RLS
    - Intermittents can create and manage their own requests
    - Regisseurs can manage requests for their events
*/

-- Create replacement_requests table
CREATE TABLE IF NOT EXISTS replacement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_assignment_id uuid NOT NULL REFERENCES event_intermittent_assignments(id) ON DELETE CASCADE,
  requester_intermittent_profile_id uuid NOT NULL REFERENCES intermittent_profiles(id) ON DELETE CASCADE,
  regisseur_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  suggested_intermittent_profile_ids uuid[],
  comment text,
  status text NOT NULL DEFAULT 'pending_approval',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT replacement_requests_request_type_check CHECK (request_type = ANY (ARRAY['urgent'::text, 'souhaite'::text])),
  CONSTRAINT replacement_requests_status_check CHECK (status = ANY (ARRAY['pending_approval'::text, 'approved_awaiting_replacement'::text, 'approved_replacement_found'::text, 'rejected_by_regisseur'::text, 'cancelled_by_intermittent'::text]))
);

-- Add table comment
COMMENT ON TABLE replacement_requests IS 'Stocke les demandes de remplacement faites par les intermittents ou pour eux.';

-- Add column comment
COMMENT ON COLUMN replacement_requests.status IS 'Statuts possibles: pending_approval, approved_awaiting_replacement (approuvé mais pas encore de remplaçant trouvé), approved_replacement_found, rejected_by_regisseur, cancelled_by_intermittent';

-- Add updated_at trigger if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_timestamp_replacement_requests'
  ) THEN
    CREATE TRIGGER set_timestamp_replacement_requests
      BEFORE UPDATE ON replacement_requests
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE replacement_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "Intermittents_peuvent_creer_demandes_remplacement" ON replacement_requests;
  DROP POLICY IF EXISTS "Intermittents_peuvent_voir_leurs_demandes" ON replacement_requests;
  DROP POLICY IF EXISTS "Intermittents_peuvent_annuler_leurs_demandes" ON replacement_requests;
  DROP POLICY IF EXISTS "Regisseurs_gestion_demandes_remplacement" ON replacement_requests;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- RLS Policies

-- Intermittents can create replacement requests for their assignments
CREATE POLICY "Intermittents_peuvent_creer_demandes_remplacement"
  ON replacement_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_intermittent_profile_id = (
      SELECT id FROM intermittent_profiles WHERE user_id = auth.uid()
    )
    AND get_current_user_role() = 'intermittent'
    AND EXISTS (
      SELECT 1 FROM event_intermittent_assignments eia
      WHERE eia.id = replacement_requests.event_assignment_id
      AND eia.intermittent_profile_id = replacement_requests.requester_intermittent_profile_id
      AND eia.statut_disponibilite = 'valide'
    )
  );

-- Intermittents can view their own requests
CREATE POLICY "Intermittents_peuvent_voir_leurs_demandes"
  ON replacement_requests
  FOR SELECT
  TO authenticated
  USING (
    requester_intermittent_profile_id = (
      SELECT id FROM intermittent_profiles WHERE user_id = auth.uid()
    )
    AND get_current_user_role() = 'intermittent'
  );

-- Intermittents can cancel their own requests
CREATE POLICY "Intermittents_peuvent_annuler_leurs_demandes"
  ON replacement_requests
  FOR UPDATE
  TO authenticated
  USING (
    requester_intermittent_profile_id = (
      SELECT id FROM intermittent_profiles WHERE user_id = auth.uid()
    )
    AND get_current_user_role() = 'intermittent'
  )
  WITH CHECK (
    status = 'cancelled_by_intermittent'
    AND requester_intermittent_profile_id = (
      SELECT id FROM intermittent_profiles WHERE user_id = auth.uid()
    )
    AND get_current_user_role() = 'intermittent'
  );

-- Regisseurs can manage replacement requests for their events
CREATE POLICY "Regisseurs_gestion_demandes_remplacement"
  ON replacement_requests
  FOR ALL
  TO authenticated
  USING (
    regisseur_id = auth.uid()
    AND get_current_user_role() = 'regisseur'
  )
  WITH CHECK (
    regisseur_id = auth.uid()
    AND get_current_user_role() = 'regisseur'
  );