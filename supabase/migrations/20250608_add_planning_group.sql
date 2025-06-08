/*
  # Ajout de la colonne "groupe" à la table event_planning_items
  
  1. Changements
    - Ajoute une colonne "groupe" à la table `event_planning_items`
    - Type: text
    - Valeur par défaut: 'techniques'
    - Contrainte: Valeurs possibles 'artistes' ou 'techniques'
  
  2. Objectif
    - Permet de catégoriser chaque item du planning comme étant destiné aux artistes ou aux techniciens
    - Utilisé pour filtrer la feuille de route selon le public cible
*/

-- Ajout de la colonne groupe avec contrainte
ALTER TABLE event_planning_items 
ADD COLUMN IF NOT EXISTS groupe TEXT NOT NULL DEFAULT 'techniques'
CHECK (groupe IN ('artistes', 'techniques'));

-- Ajout d'un commentaire explicatif
COMMENT ON COLUMN event_planning_items.groupe IS 'Indique si l''item du planning est destiné aux artistes ou aux techniciens. Utilisé pour le filtrage de la feuille de route.';
