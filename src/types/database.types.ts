// Types énumérés correspondant à la base de données
export type UserRole = 'regisseur' | 'intermittent' | 'admin';
export type EventStatus = 'brouillon' | 'publie' | 'annule' | 'termine';
export type AvailabilityStatus = 'propose' | 'disponible' | 'incertain' | 'non_disponible' | 'valide' | 'non_retenu';
export type NotificationType = 'nouveau_evenement' | 'modification_evenement' | 'assignation' | 'reponse_intermittent' | 'rappel' | 'annulation' | 'message_direct' | 'systeme';
export type PlanningGroupType = 'artistes' | 'techniques';
export type InfoFieldType = 'son' | 'lumiere' | 'plateau' | 'general';

// Interface pour les profils régisseurs
export interface RegisseurProfile {
  id: string;
  user_id: string | null;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  organisation?: string | null;
  logo_path?: string | null;
  created_at: string;
  updated_at: string;
  profil_complete: boolean;
}

// Interface pour les profils intermittents
export interface IntermittentProfile {
  id: string;
  user_id: string | null;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  specialite?: string | null;
  bio?: string | null;
  photo_path?: string | null;
  adresse?: string | null;
  numero_secu?: string | null;
  numero_conges_spectacles?: string | null;
  created_at: string;
  updated_at: string;
  organisme_principal_id?: string | null;
  profil_complete: boolean;
}

// Interface pour les événements
export interface Event {
  id: string;
  regisseur_id: string;
  nom_evenement: string;
  date_debut: string;
  date_fin: string;
  lieu?: string | null;
  description?: string | null;
  statut_evenement: EventStatus;
  specialites_requises?: string[] | null;
  created_at: string;
  updated_at: string;
}

// Interface pour les assignations intermittent-événement
export interface EventIntermittentAssignment {
  id: string;
  event_id: string;
  intermittent_profile_id: string;
  statut_disponibilite: AvailabilityStatus;
  role_assigne?: string | null;
  commentaire?: string | null;
  date_reponse?: string | null;
  created_at: string;
  updated_at: string;
}

// Interface pour les notifications
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  titre: string;
  contenu: string;
  lien?: string | null;
  est_lu: boolean;
  reference_id?: string | null;
  created_at: string;
  updated_at: string;
}

// Interface pour les éléments de planning
export interface EventPlanningItem {
  id: string;
  event_id: string;
  titre: string;
  description?: string | null;
  heure_debut: string;
  heure_fin: string;
  lieu?: string | null;
  responsable?: string | null;
  created_at: string;
  updated_at: string;
}

// Interface pour les groupes de planning
export interface PlanningGroup {
  id: string;
  event_id: string;
  nom: string;
  type: PlanningGroupType;
  ordre: number;
  created_at: string;
  updated_at: string;
}

// Interface pour les champs d'information spécifiques
export interface EventInformationField {
  id: string;
  event_id: string;
  type: InfoFieldType;
  titre: string;
  contenu: string;
  created_at: string;
  updated_at: string;
}

// Interface pour les réponses aux événements
export interface EventResponse {
  id: string;
  assignment_id: string;
  statut: AvailabilityStatus;
  commentaire?: string | null;
  date_reponse: string;
  created_at: string;
  updated_at: string;
}

// Interface pour les thèmes personnalisés
export interface CustomTheme {
  id: string;
  regisseur_id: string;
  nom_theme: string;
  couleur_primaire: string;
  couleur_secondaire: string;
  couleur_accent: string;
  couleur_texte: string;
  couleur_fond: string;
  logo_path?: string | null;
  est_actif: boolean;
  created_at: string;
  updated_at: string;
}

// Interface pour les modèles de messages
export interface MessageTemplate {
  id: string;
  regisseur_id: string;
  titre: string;
  contenu: string;
  type: string;
  created_at: string;
  updated_at: string;
}

// Interface pour les informations de lieu
export interface VenueInformation {
  id: string;
  regisseur_id: string;
  nom_lieu: string;
  adresse: string;
  plan_acces?: string | null;
  informations_techniques?: string | null;
  contacts?: string | null;
  created_at: string;
  updated_at: string;
}
