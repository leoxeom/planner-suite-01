import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LoadingScreen } from '../common/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Gardé pour compatibilité mais non utilisé temporairement
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children 
}) => {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  // Logs de debug améliorés
  useEffect(() => {
    console.debug('[ProtectedRoute] État actuel:', { 
      path: location.pathname,
      isAuthenticated: !!user,
      isLoading,
      userId: user?.id || 'non connecté',
      userEmail: user?.email || 'non disponible'
    });
  }, [user, isLoading, location]);

  // Afficher le loading pendant le chargement
  if (isLoading) {
    console.debug('[ProtectedRoute] Chargement en cours...');
    return <LoadingScreen message="Vérification de votre session..." />;
  }

  // Vérification simple : l'utilisateur est-il connecté ?
  if (!user) {
    console.debug('[ProtectedRoute] Utilisateur non connecté, redirection vers login');
    // Stocker la page actuelle pour y revenir après connexion
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Utilisateur connecté, accès autorisé
  console.debug('[ProtectedRoute] Accès autorisé pour', user.email);
  return <>{children}</>;
};
