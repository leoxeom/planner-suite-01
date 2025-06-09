import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, setupSessionRefreshInterval } from '../../store/authStore';
import { LoadingScreen } from '../common/LoadingScreen';
import { UserRole } from '../../types/auth.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, isLoading, sessionStatus, refreshSession } = useAuthStore();
  const location = useLocation();
  const [isRetrying, setIsRetrying] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  // Setup session refresh interval when component mounts
  useEffect(() => {
    console.debug('[ProtectedRoute] Setting up session management');
    const cleanupInterval = setupSessionRefreshInterval(10); // Check every 10 minutes
    
    return () => {
      console.debug('[ProtectedRoute] Cleaning up session management');
      cleanupInterval();
    };
  }, []);

  // Handle session refresh when needed
  useEffect(() => {
    const handleSessionRefresh = async () => {
      if (sessionStatus === 'expired' && !isRetrying) {
        console.debug('[ProtectedRoute] Session expired, attempting refresh');
        setIsRetrying(true);
        
        const success = await refreshSession();
        
        if (!success) {
          console.debug('[ProtectedRoute] Session refresh failed, starting redirect countdown');
          // Start countdown before redirecting to login
          setRedirectCountdown(3);
        } else {
          console.debug('[ProtectedRoute] Session refresh successful');
          setIsRetrying(false);
        }
      }
    };
    
    handleSessionRefresh();
  }, [sessionStatus, refreshSession, isRetrying]);

  // Handle countdown timer for delayed redirect
  useEffect(() => {
    if (redirectCountdown === null) return;
    
    if (redirectCountdown <= 0) {
      console.debug('[ProtectedRoute] Redirect countdown finished, redirecting to login');
      setRedirectCountdown(null);
      return;
    }
    
    const timer = setTimeout(() => {
      console.debug(`[ProtectedRoute] Redirect in ${redirectCountdown - 1} seconds`);
      setRedirectCountdown(redirectCountdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [redirectCountdown]);

  // Check if loading or refreshing session
  if (isLoading || sessionStatus === 'refreshing' || isRetrying) {
    console.debug(`[ProtectedRoute] Showing loading screen. Status: loading=${isLoading}, sessionStatus=${sessionStatus}, isRetrying=${isRetrying}`);
    return <LoadingScreen />;
  }

  // If countdown is active, show loading screen with message
  if (redirectCountdown !== null && redirectCountdown > 0) {
    console.debug(`[ProtectedRoute] In redirect countdown: ${redirectCountdown}`);
    return <LoadingScreen message={`Session expirée. Redirection dans ${redirectCountdown}...`} />;
  }

  // Check if user is authenticated
  if (!user || sessionStatus === 'expired') {
    console.debug('[ProtectedRoute] No authenticated user or expired session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role (if roles are specified)
  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    console.debug(`[ProtectedRoute] User role ${user.role} not in allowed roles: ${allowedRoles.join(', ')}`);
    return <Navigate to="/unauthorized" replace />;
  }

  console.debug('[ProtectedRoute] Access granted');
  return <>{children}</>;
};
