/*
  # Création de la table de notifications et politiques associées
  
  1. Nouvelle table
    - `notifications` pour stocker les notifications utilisateur
    - Permet de suivre les demandes de remplacement, mises à jour d'événements, etc.
    - Chaque notification est liée à un utilisateur spécifique
  
  2. Indexation
    - Index sur user_id pour des requêtes rapides par utilisateur
    - Index sur type pour filtrer par type de notification
    - Index sur is_read pour filtrer les notifications non lues
    - Index sur related_event_id et related_request_id pour les recherches associées
  
  3. Sécurité
    - Activation de RLS
    - Les utilisateurs ne peuvent voir que leurs propres notifications
    - Les utilisateurs peuvent marquer leurs notifications comme lues
*/

-- Création de la table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  content text NOT NULL,
  related_event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  related_request_id uuid REFERENCES replacement_requests(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT notifications_type_check CHECK (
    type = ANY (ARRAY[
      'replacement_request'::text, 
      'event_update'::text, 
      'event_cancelled'::text, 
      'team_validated'::text,
      'request_approved'::text,
      'request_rejected'::text
    ])
  )
);

-- Ajout de commentaires sur la table et les colonnes
COMMENT ON TABLE notifications IS 'Stocke les notifications pour les utilisateurs';
COMMENT ON COLUMN notifications.type IS 'Type de notification: replacement_request, event_update, event_cancelled, team_validated, request_approved, request_rejected';
COMMENT ON COLUMN notifications.related_event_id IS 'ID de l''événement associé à la notification, si applicable';
COMMENT ON COLUMN notifications.related_request_id IS 'ID de la demande de remplacement associée à la notification, si applicable';

-- Création d'index pour améliorer les performances
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_related_event_id ON notifications(related_event_id) WHERE related_event_id IS NOT NULL;
CREATE INDEX idx_notifications_related_request_id ON notifications(related_request_id) WHERE related_request_id IS NOT NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Ajout du trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_timestamp_notifications'
  ) THEN
    CREATE TRIGGER set_timestamp_notifications
      BEFORE UPDATE ON notifications
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END $$;

-- Activation de RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Suppression des politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Utilisateurs_peuvent_voir_leurs_notifications" ON notifications;
DROP POLICY IF EXISTS "Utilisateurs_peuvent_marquer_notifications_lues" ON notifications;

-- Politique permettant aux utilisateurs de voir leurs propres notifications
CREATE POLICY "Utilisateurs_peuvent_voir_leurs_notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Politique permettant aux utilisateurs de marquer leurs notifications comme lues
CREATE POLICY "Utilisateurs_peuvent_marquer_notifications_lues"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid() AND
    (
      -- Seul le champ is_read peut être modifié
      OLD.user_id = NEW.user_id AND
      OLD.type = NEW.type AND
      OLD.content = NEW.content AND
      OLD.related_event_id IS NOT DISTINCT FROM NEW.related_event_id AND
      OLD.related_request_id IS NOT DISTINCT FROM NEW.related_request_id AND
      OLD.created_at = NEW.created_at
    )
  );

-- Fonction pour créer une notification de demande de remplacement
CREATE OR REPLACE FUNCTION create_replacement_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Récupérer les informations de l'événement
  DECLARE
    event_name text;
    event_id uuid;
  BEGIN
    SELECT e.nom_evenement, e.id INTO event_name, event_id
    FROM event_intermittent_assignments eia
    JOIN events e ON eia.event_id = e.id
    WHERE eia.id = NEW.event_assignment_id;

    -- Créer une notification pour le régisseur
    INSERT INTO notifications (
      user_id,
      type,
      content,
      related_event_id,
      related_request_id
    ) VALUES (
      NEW.regisseur_id,
      'replacement_request',
      'Nouvelle demande de remplacement pour "' || event_name || '"',
      event_id,
      NEW.id
    );
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger pour les notifications de demande de remplacement
DROP TRIGGER IF EXISTS trigger_create_replacement_notification ON replacement_requests;
CREATE TRIGGER trigger_create_replacement_notification
  AFTER INSERT ON replacement_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_replacement_request_notification();
