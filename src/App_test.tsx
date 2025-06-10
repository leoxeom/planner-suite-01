import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

// Composants simples pour tester le routing
const HomePage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
    <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl max-w-md w-full">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-400">
        Page d'accueil
      </h1>
      <p className="text-center mb-6">
        Cette page teste le routing simple avec React Router.
      </p>
      <div className="flex justify-center gap-4">
        <Link 
          to="/login" 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
        >
          Se connecter
        </Link>
      </div>
    </div>
  </div>
);

// Composant de login simple
const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simuler une connexion
    setTimeout(() => {
      toast.success('Connexion réussie');
      // Stocker un faux token dans localStorage pour simuler l'authentification
      localStorage.setItem('test_auth', JSON.stringify({ 
        isAuthenticated: true, 
        email: email,
        role: 'regisseur'
      }));
      
      // Rediriger vers le dashboard après un court délai
      setTimeout(() => {
        navigate('/dashboard');
      }, 300);
      
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-400">
          Connexion Test
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
        
        <div className="mt-4 text-center">
          <Link to="/" className="text-blue-400 hover:text-blue-300">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

// Composant Dashboard simple
const DashboardPage = () => {
  const navigate = useNavigate();
  
  // Récupérer les infos d'authentification du localStorage
  const getAuthInfo = () => {
    const authData = localStorage.getItem('test_auth');
    return authData ? JSON.parse(authData) : null;
  };
  
  const authInfo = getAuthInfo();
  
  const handleLogout = () => {
    localStorage.removeItem('test_auth');
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-400">
          Dashboard Test
        </h1>
        
        {authInfo ? (
          <div className="space-y-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Informations utilisateur :</h2>
              <p><span className="font-medium text-gray-300">Email:</span> {authInfo.email}</p>
              <p><span className="font-medium text-gray-300">Rôle:</span> {authInfo.role}</p>
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

// Composant pour protéger les routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Vérifier si l'utilisateur est connecté
  const isAuthenticated = localStorage.getItem('test_auth') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Application principale
function App_test() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
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

export default App_test;
