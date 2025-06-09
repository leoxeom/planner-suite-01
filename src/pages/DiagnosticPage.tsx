import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useProfileStore } from '../store/profileStore';

const DiagnosticPage: React.FC = () => {
  // États pour stocker les résultats des tests
  const [supabaseStatus, setSupabaseStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'pending' | 'success' | 'error' | 'not_logged_in'>('pending');
  const [authDetails, setAuthDetails] = useState<any>(null);
  const [queryResults, setQueryResults] = useState<Record<string, any>>({});
  const [logs, setLogs] = useState<string[]>([]);
  
  // Formulaire de connexion
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginStatus, setLoginStatus] = useState<string | null>(null);

  // Accès aux stores
  const { user, isLoading: authLoading, signIn, signOut } = useAuthStore();
  const { currentTheme, isDarkMode } = useThemeStore();
  const { regisseurProfile, intermittentProfile, isLoading: profileLoading } = useProfileStore();

  // Fonction pour ajouter des logs
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
    console.log(`[Diagnostic] ${message}`);
  };

  // Test de connexion Supabase
  const testSupabaseConnection = async () => {
    try {
      addLog('Testant la connexion Supabase...');
      const { data, error } = await supabase.from('regisseur_profiles').select('count').limit(1);
      
      if (error) {
        addLog(`Erreur de connexion Supabase: ${error.message}`);
        setSupabaseStatus('error');
        setSupabaseError(error.message);
        return false;
      }
      
      addLog('Connexion Supabase réussie');
      setSupabaseStatus('success');
      return true;
    } catch (error: any) {
      addLog(`Exception lors du test Supabase: ${error.message}`);
      setSupabaseStatus('error');
      setSupabaseError(error.message);
      return false;
    }
  };

  // Vérification de l'authentification
  const checkAuthentication = async () => {
    try {
      addLog('Vérifiant l\'état d\'authentification...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        addLog(`Erreur lors de la récupération de la session: ${error.message}`);
        setAuthStatus('error');
        return;
      }
      
      if (!session) {
        addLog('Aucune session active trouvée');
        setAuthStatus('not_logged_in');
        return;
      }
      
      addLog(`Session active trouvée pour: ${session.user.email}`);
      setAuthStatus('success');
      
      // Récupérer les détails complets
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        addLog(`Erreur lors de la récupération des détails utilisateur: ${userError.message}`);
        return;
      }
      
      const details = {
        id: userData.user?.id,
        email: userData.user?.email,
        app_metadata: userData.user?.app_metadata,
        user_metadata: userData.user?.user_metadata,
        created_at: userData.user?.created_at,
        last_sign_in_at: userData.user?.last_sign_in_at
      };
      
      addLog(`Détails utilisateur récupérés: ${userData.user?.email}`);
      setAuthDetails(details);
    } catch (error: any) {
      addLog(`Exception lors de la vérification d'authentification: ${error.message}`);
      setAuthStatus('error');
    }
  };

  // Test de requêtes sur différentes tables
  const testQueries = async () => {
    const tables = ['regisseur_profiles', 'intermittent_profiles', 'events', 'event_intermittent_assignments'];
    const results: Record<string, any> = {};
    
    for (const table of tables) {
      try {
        addLog(`Testant la requête sur la table ${table}...`);
        const { data, error } = await supabase.from(table).select('count');
        
        if (error) {
          addLog(`Erreur lors de la requête sur ${table}: ${error.message}`);
          results[table] = { status: 'error', message: error.message };
        } else {
          addLog(`Requête réussie sur ${table}: ${data[0]?.count || 0} enregistrements`);
          results[table] = { status: 'success', count: data[0]?.count || 0 };
          
          // Récupérer quelques exemples si disponibles
          if (data[0]?.count > 0) {
            const { data: samples, error: sampleError } = await supabase
              .from(table)
              .select('*')
              .limit(3);
              
            if (!sampleError && samples) {
              results[table].samples = samples;
            }
          }
        }
      } catch (error: any) {
        addLog(`Exception lors du test de la table ${table}: ${error.message}`);
        results[table] = { status: 'error', message: error.message };
      }
    }
    
    setQueryResults(results);
  };

  // Fonction de connexion
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStatus('Tentative de connexion...');
    
    try {
      addLog(`Tentative de connexion avec: ${email}`);
      const { data, error } = await signIn(email, password);
      
      if (error) {
        addLog(`Erreur de connexion: ${error.message}`);
        setLoginStatus(`Échec: ${error.message}`);
        return;
      }
      
      addLog('Connexion réussie!');
      setLoginStatus('Connexion réussie!');
      
      // Rafraîchir les données
      checkAuthentication();
    } catch (error: any) {
      addLog(`Exception lors de la connexion: ${error.message}`);
      setLoginStatus(`Exception: ${error.message}`);
    }
  };

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      addLog('Tentative de déconnexion...');
      await signOut();
      addLog('Déconnexion réussie');
      setAuthStatus('not_logged_in');
      setAuthDetails(null);
    } catch (error: any) {
      addLog(`Erreur lors de la déconnexion: ${error.message}`);
    }
  };

  // Exécuter les tests au chargement
  useEffect(() => {
    addLog('Page de diagnostic initialisée');
    testSupabaseConnection().then(success => {
      if (success) {
        checkAuthentication();
        testQueries();
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Diagnostic Stage Planner Alpha</h1>
        
        {/* Section connexion */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connexion directe</h2>
          
          {authStatus === 'success' ? (
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-green-600 font-medium">Connecté en tant que: {authDetails?.email}</span>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block mb-1">Email:</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Mot de passe:</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={authLoading}
              >
                {authLoading ? 'Connexion...' : 'Se connecter'}
              </button>
              {loginStatus && (
                <div className={`mt-2 text-sm ${loginStatus.includes('Échec') || loginStatus.includes('Exception') ? 'text-red-500' : 'text-green-500'}`}>
                  {loginStatus}
                </div>
              )}
            </form>
          )}
        </div>
        
        {/* État de la connexion Supabase */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connexion Supabase</h2>
          
          <div className="flex items-center mb-2">
            <span className="font-medium mr-2">Statut:</span>
            {supabaseStatus === 'pending' && <span className="text-yellow-500">En attente...</span>}
            {supabaseStatus === 'success' && <span className="text-green-500">Connecté</span>}
            {supabaseStatus === 'error' && <span className="text-red-500">Erreur</span>}
          </div>
          
          {supabaseError && (
            <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">
              {supabaseError}
            </div>
          )}
          
          <button 
            onClick={testSupabaseConnection}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tester à nouveau
          </button>
        </div>
        
        {/* État de l'authentification */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">État d'authentification</h2>
          
          <div className="flex items-center mb-4">
            <span className="font-medium mr-2">Statut:</span>
            {authStatus === 'pending' && <span className="text-yellow-500">En attente...</span>}
            {authStatus === 'success' && <span className="text-green-500">Authentifié</span>}
            {authStatus === 'not_logged_in' && <span className="text-yellow-500">Non connecté</span>}
            {authStatus === 'error' && <span className="text-red-500">Erreur</span>}
          </div>
          
          {authDetails && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Détails utilisateur:</h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto max-h-60">
                {JSON.stringify(authDetails, null, 2)}
              </pre>
            </div>
          )}
          
          <button 
            onClick={checkAuthentication}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Vérifier à nouveau
          </button>
        </div>
        
        {/* État des stores */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">État des stores</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">AuthStore:</h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto max-h-60">
                {JSON.stringify({
                  user: user ? {
                    id: user.id,
                    email: user.email,
                    role: user.role
                  } : null,
                  isLoading: authLoading
                }, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">ThemeStore:</h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto max-h-60">
                {JSON.stringify({
                  isDarkMode,
                  theme: currentTheme ? {
                    name: currentTheme.name,
                    isDark: currentTheme.isDark
                  } : null
                }, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">ProfileStore:</h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto max-h-60">
                {JSON.stringify({
                  isLoading: profileLoading,
                  hasRegisseurProfile: !!regisseurProfile,
                  hasIntermittentProfile: !!intermittentProfile,
                  regisseurProfile: regisseurProfile ? {
                    id: regisseurProfile.id,
                    nom: regisseurProfile.nom,
                    prenom: regisseurProfile.prenom,
                    email: regisseurProfile.email,
                    organisation: regisseurProfile.organisation
                  } : null,
                  intermittentProfile: intermittentProfile ? {
                    id: intermittentProfile.id,
                    nom: intermittentProfile.nom,
                    prenom: intermittentProfile.prenom,
                    email: intermittentProfile.email,
                    specialite: intermittentProfile.specialite
                  } : null
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
        
        {/* Test de requêtes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test des requêtes</h2>
          
          {Object.keys(queryResults).length === 0 ? (
            <div className="text-yellow-500">En attente des résultats...</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(queryResults).map(([table, result]: [string, any]) => (
                <div key={table} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <h3 className="font-medium mb-2">Table: {table}</h3>
                  <div className="flex items-center mb-2">
                    <span className="mr-2">Statut:</span>
                    {result.status === 'success' ? (
                      <span className="text-green-500">Succès ({result.count} enregistrements)</span>
                    ) : (
                      <span className="text-red-500">Erreur: {result.message}</span>
                    )}
                  </div>
                  
                  {result.samples && result.samples.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium mb-1">Exemples:</h4>
                      <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto max-h-60">
                        {JSON.stringify(result.samples, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <button 
            onClick={testQueries}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tester à nouveau
          </button>
        </div>
        
        {/* Logs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Logs de diagnostic</h2>
          
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto max-h-96">
            {logs.length === 0 ? (
              <div className="text-gray-500">Aucun log disponible</div>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setLogs([])}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Effacer les logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;
