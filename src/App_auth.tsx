import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { initializeAuth, useAuthStore } from './store/authStore';

// Initialiser l'authentification au démarrage
initializeAuth();

// Composant de login utilisant le vrai authStore
const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast.error('Identifiants incorrects');
        setIsLoading(false);
        return;
      }
      
      toast.success('Connexion réussie');
      
      // Attendre que l'état soit mis à jour avant de naviguer
      setTimeout(() => {
        navigate('/dashboard');
      }, 300);
    } catch (error) {
      console.error('Erreur de connexion:', error);
      toast.error('Erreur lors de la connexion');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-400">
          Connexion (authStore réel)
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="votre@email.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-lg transition-colors ${
              isLoading 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Dashboard simple utilisant le vrai authStore
const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-400">
          Dashboard (authStore réel)
        </h1>
        
        {user ? (
          <div className="space-y-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Informations utilisateur :</h2>
              <p><span className="font-medium text-gray-300">Email:</span> {user.email}</p>
              <p><span className="font-medium text-gray-300">Rôle:</span> {user.role || 'Non défini'}</p>
              <p><span className="font-medium text-gray-300">ID:</span> {user.id}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4">Vous n'êtes pas connecté.</p>
            <Link 
              to="/login" 
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Se connecter
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant pour protéger les routes avec le vrai authStore
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuthStore();
  
  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Rediriger si non connecté
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Application principale avec authStore
function App_auth() {
  const { isLoading } = useAuthStore();

  // Afficher un loader pendant l'initialisation de l'auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-white">Chargement de l'authentification...</p>
      </div>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </>
  );
}

export default App_auth;
