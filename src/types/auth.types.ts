export type UserRole = 'regisseur' | 'intermittent';

export interface UserSession {
  user: {
    id: string;
    email: string;
    role?: UserRole;
  } | null;
  isLoading: boolean;
}

export interface AuthFormData {
  email: string;
  password: string;
}

export interface RegisterFormData extends AuthFormData {
  fullName: string;
  role: UserRole;
  profession?: string; // Only for intermittents
  companyName?: string; // Only for regisseurs
}

export interface Team {
  id: string;
  name: string;
  color: string;
  description: string | null;
  member_count?: number;
  memberIds?: string[];
}