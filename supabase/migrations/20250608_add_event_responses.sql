/*
  # Création de la table event_intermittent_responses
  
  1. Nouvelle table
    - `event_intermittent_responses` pour stocker les réponses des intermittents aux propositions d'événements
    - Permet de suivre les acceptations, refus et propositions alternatives de dates
    - Conserve l'historique des interactions entre régisseurs et intermittents
  
  2. Sécurité
    - Activation de RLS
    - Les intermittents peuvent créer et voir uniquement leurs propres réponses
    - Les régisseurs peuvent voir toutes les réponses pour leurs événements
*/

-- Création de la table event_intermittent_responses
CREATE TABLE IF NOT EXISTS event_intermittent_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_assignment_id uuid NOT NULL REFERENCES event_intermittent_assignments(id) ON DELETE CASCADE,
  response_type text NOT NULL,
  response_date timestamptz DEFAULT now() NOT NULL,
  comment text,
  alternative_dates timestamptz[],
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT event_intermittent_responses_response_type_check CHECK (
    response_type = ANY (ARRAY['accept'::text, 'refuse'::text, 'propose_alternative'::text])
  )
);

-- Ajout de commentaires sur la table et les colonnes
COMMENT ON TABLE event_intermittent_responses IS 'Stocke les réponses des intermittents aux propositions d''événements';
COMMENT ON COLUMN event_intermittent_responses.response_type IS 'Type de réponse: accept (accepte la date), refuse (refuse la date), propose_alternative (propose d''autres dates)';
COMMENT ON COLUMN event_intermittent_responses.alternative_dates IS 'Tableau de dates alternatives proposées par l''intermittent';

-- Création d'index pour améliorer les performances
CREATE INDEX idx_event_intermittent_responses_assignment_id ON event_intermittent_responses(event_assignment_id);
CREATE INDEX idx_event_intermittent_responses_type ON event_intermittent_responses(response_type);

-- Ajout du trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_timestamp_event_intermittent_responses'
  ) THEN
    CREATE TRIGGER set_timestamp_event_intermittent_responses
      BEFORE UPDATE ON event_intermittent_responses
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END $$;

-- Activation de RLS
ALTER TABLE event_intermittent_responses ENABLE ROW LEVEL SECURITY;

-- Suppression des politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Intermittents_peuvent_voir_leurs_reponses" ON event_intermittent_responses;
DROP POLICY IF EXISTS "Intermittents_peuvent_creer_leurs_reponses" ON event_intermittent_responses;
DROP POLICY IF EXISTS "Regisseurs_peuvent_voir_reponses_leurs_evenements" ON event_intermittent_responses;

-- Politique permettant aux intermittents de voir leurs propres réponses
CREATE POLICY "Intermittents_peuvent_voir_leurs_reponses"
  ON event_intermittent_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_intermittent_assignments eia
      JOIN intermittent_profiles ip ON eia.intermittent_profile_id = ip.id
      WHERE eia.id = event_intermittent_responses.event_assignment_id
      AND ip.user_id = auth.uid()
      AND get_current_user_role() = 'intermittent'
    )
  );

-- Politique permettant aux intermittents de créer leurs propres réponses
CREATE POLICY "Intermittents_peuvent_creer_leurs_reponses"
  ON event_intermittent_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_intermittent_assignments eia
      JOIN intermittent_profiles ip ON eia.intermittent_profile_id = ip.id
      WHERE eia.id = event_intermittent_responses.event_assignment_id
      AND ip.user_id = auth.uid()
      AND get_current_user_role() = 'intermittent'
    )
  );

-- Politique permettant aux régisseurs de voir les réponses pour leurs événements
CREATE POLICY "Regisseurs_peuvent_voir_reponses_leurs_evenements"
  ON event_intermittent_responses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_intermittent_assignments eia
      JOIN events e ON eia.event_id = e.id
      WHERE eia.id = event_intermittent_responses.event_assignment_id
      AND e.regisseur_id = auth.uid()
      AND get_current_user_role() = 'regisseur'
    )
  );

-- Fonction pour mettre à jour automatiquement le statut de disponibilité
CREATE OR REPLACE FUNCTION update_intermittent_availability_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Mise à jour du statut dans event_intermittent_assignments en fonction de la réponse
  IF NEW.response_type = 'accept' THEN
    UPDATE event_intermittent_assignments
    SET statut_disponibilite = 'disponible'
    WHERE id = NEW.event_assignment_id;
  ELSIF NEW.response_type = 'refuse' THEN
    UPDATE event_intermittent_assignments
    SET statut_disponibilite = 'non_disponible'
    WHERE id = NEW.event_assignment_id;
  ELSIF NEW.response_type = 'propose_alternative' THEN
    UPDATE event_intermittent_assignments
    SET statut_disponibilite = 'incertain'
    WHERE id = NEW.event_assignment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger pour exécuter la fonction après insertion
CREATE TRIGGER trigger_update_intermittent_availability
  AFTER INSERT ON event_intermittent_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_intermittent_availability_status();
