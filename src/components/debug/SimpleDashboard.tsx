import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';

/**
 * Composant de dashboard simplifié pour déboguer le problème de page blanche
 * N'utilise que le store d'authentification de base
 */
export const SimpleDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-white/10 shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-primary-400">
          Dashboard fonctionne !
        </h1>
        
        <div className="space-y-4 mb-8">
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Informations utilisateur :</h2>
            <p><span className="font-medium text-gray-300">Email:</span> {user?.email}</p>
            <p><span className="font-medium text-gray-300">Rôle:</span> {user?.role || 'Non défini'}</p>
            <p><span className="font-medium text-gray-300">ID:</span> {user?.id}</p>
          </div>
          
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">État de l'authentification :</h2>
            <p><span className="font-medium text-gray-300">Connecté:</span> {user ? 'Oui' : 'Non'}</p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Se déconnecter
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Retour au Dashboard Principal
          </button>
        </div>
      </div>
    </div>
  );
};
