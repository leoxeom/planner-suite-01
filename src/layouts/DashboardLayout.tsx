import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header ultra simple */}
      <header className="bg-gray-800 p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard fonctionne</h1>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300">
              Connecté en tant que: {user?.email}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - ultra simple */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
          <h2 className="text-xl font-bold mb-4">Bienvenue dans le Dashboard</h2>
          <p className="text-gray-300">
            Cette version simplifiée du dashboard devrait fonctionner sans erreur.
          </p>
          <p className="mt-4 text-green-400 font-bold">
            Si vous voyez ce message, le DashboardLayout fonctionne correctement.
          </p>
        </div>
        
        {/* Outlet pour les composants enfants */}
        <Outlet />
      </main>
    </div>
  );
};
