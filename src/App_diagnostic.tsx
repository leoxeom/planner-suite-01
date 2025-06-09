import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DiagnosticPage from './pages/DiagnosticPage';
import { initializeAuth } from './store/authStore';
import { initializeTheme } from './store/themeStore';

/**
 * Version simplifiée de App.tsx pour le diagnostic
 * Cette version contourne les protections d'authentification
 * et permet d'accéder directement à la page de diagnostic
 */
function App() {
  // Initialiser les stores au démarrage
  useEffect(() => {
    console.log('[App_diagnostic] Initializing stores...');
    
    // Initialiser l'authentification
    const cleanup = initializeAuth();
    
    // Initialiser le thème
    initializeTheme();
    
    return cleanup;
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Route de diagnostic accessible sans protection */}
        <Route path="/diagnostic" element={<DiagnosticPage />} />
        
        {/* Rediriger toutes les autres routes vers le diagnostic */}
        <Route path="*" element={<Navigate to="/diagnostic" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
