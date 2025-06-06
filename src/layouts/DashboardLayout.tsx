import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { useNotificationStore } from '../store/notificationStore';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { NotificationBell } from '../components/dashboard/NotificationBell';
import { BottomNav } from '../components/dashboard/BottomNav';
import { LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { regisseurProfile, fetchRegisseurProfile } = useProfileStore();
  const { fetchNotifications } = useNotificationStore();
  
  useEffect(() => {
    if (user?.role === 'regisseur') {
      fetchRegisseurProfile(user.id);
      fetchNotifications(user.id);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-radial relative overflow-hidden pb-28">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Animated Orbs */}
        <div className="orb orb-primary" />
        <div className="orb orb-secondary" />
        {/* Grid Overlay */}
        <div className="grid-overlay" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3 glass">
        <div className="container mx-auto flex items-center justify-between">
          {user?.role === 'regisseur' && regisseurProfile && (
            <div className="flex items-center space-x-4">
              {regisseurProfile.logo_url && (
                <img 
                  src={regisseurProfile.logo_url} 
                  alt="Logo" 
                  className="h-8 w-auto"
                />
              )}
              <h2 className="font-heading font-semibold text-lg tracking-wider text-white truncate">
                {regisseurProfile.nom_organisme || 'STAGEPLANNER'}
              </h2>
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            {user?.role === 'regisseur' && <NotificationBell />}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-dark-700/50 transition-colors group"
              title="Se déconnecter"
            >
              <LogOut size={24} className="text-gray-400 group-hover:text-error-500 transition-colors" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Slogan */}
      <div className="fixed bottom-28 left-0 right-0 text-center">
        <p className="font-heading text-xs text-dark-400 tracking-wide uppercase">
          Breathe, and relax your an*s
        </p>
      </div>
    </div>
  );
};