import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthLayout } from './layouts/AuthLayout';
import { UnifiedLoginPage } from './pages/auth/UnifiedLoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { RegisterPage } from './pages/auth/RegisterPage';
import { RegisseurDashboard } from './pages/dashboard/RegisseurDashboard';
import { RegisseurCalendar } from './pages/dashboard/RegisseurCalendar';
import { IntermittentDashboard } from './pages/dashboard/IntermittentDashboard';
import { MessageTemplates } from './pages/regisseur/MessageTemplates';
import { CreateIntermittent } from './pages/regisseur/CreateIntermittent';
import { IntermittentManagement } from './pages/regisseur/IntermittentManagement';
import { VenueInformation as RegisseurVenueInformation } from './pages/regisseur/VenueInformation';
import { VenueInformation as IntermittentVenueInformation } from './pages/intermittent/VenueInformation';
import { IntermittentProfile } from './pages/regisseur/IntermittentProfile';
import { CreateEvent } from './pages/regisseur/CreateEvent';
import { EventDetails } from './pages/regisseur/EventDetails';
import { IntermittentEventDetails } from './pages/intermittent/IntermittentEventDetails';
import { VenueInformation } from './pages/regisseur/VenueInformation';
import { ThemeCustomization } from './pages/regisseur/ThemeCustomization';
import { ProtectedRoute } from './components/dashboard/ProtectedRoute';
import { LoadingScreen } from './components/common/LoadingScreen';
import { initializeAuth, useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

const UnauthorizedPage = () => (
  <div className="min-h-screen bg-gray-100 dark:bg-dark-950 flex items-center justify-center">
    <div className="bg-white dark:bg-dark-800 p-8 rounded-xl shadow-lg text-center">
      <h1 className="text-2xl font-bold mb-4 text-error-600">Accès Refusé</h1>
      <p className="mb-4">Vous n'avez pas l'autorisation d'accéder à cette page.</p>
      <button 
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
      >
        Retour
      </button>
    </div>
  </div>
);

function App() {
  const { isLoading, user } = useAuthStore();
  const { fetchTheme } = useThemeStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTheme(user.id, user.role);
    }
  }, [user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Router>
        <Routes>
          {/* Auth routes */}
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<Navigate to="/login" replace />} />
            <Route path="login" element={<UnifiedLoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>
          
          {/* Protected dashboard routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Common dashboard */}
            <Route index element={
              user?.role === 'regisseur' 
                ? <RegisseurDashboard /> 
                : <IntermittentDashboard />
            } />

            {/* Events routes */}
            <Route path="calendar" element={
              <ProtectedRoute allowedRoles={['regisseur']}>
                <RegisseurCalendar />
              </ProtectedRoute>
            } />
            <Route path="events/:eventId" element={
              <ProtectedRoute allowedRoles={['regisseur']}>
                <EventDetails />
              </ProtectedRoute>
            } />
            <Route path="events/edit/:eventId" element={
              <ProtectedRoute allowedRoles={['regisseur']}>
                <CreateEvent />
              </ProtectedRoute>
            } />
            <Route path="events/create" element={
              <ProtectedRoute allowedRoles={['regisseur']}>
                <CreateEvent />
              </ProtectedRoute>
            } />

            {/* Intermittent event details */}
            <Route path="intermittent/events/:eventId" element={
              <ProtectedRoute allowedRoles={['intermittent']}>
                <IntermittentEventDetails />
              </ProtectedRoute>
            } />

            {/* Intermittents management routes */}
            <Route path="intermittents" element={
              <ProtectedRoute allowedRoles={['regisseur']}>
                <IntermittentManagement />
              </ProtectedRoute>
            } />
            <Route path="intermittents/create" element={
              <ProtectedRoute allowedRoles={['regisseur']}>
                <CreateIntermittent />
              </ProtectedRoute>
            } />
            <Route path="intermittents/profile/:intermittentId" element={
              <ProtectedRoute allowedRoles={['regisseur']}>
                <IntermittentProfile />
              </ProtectedRoute>
            } />

            {/* Messages routes */}
            <Route path="messages" element={
              <ProtectedRoute allowedRoles={['regisseur']}>
                <MessageTemplates />
              </ProtectedRoute>
            } />

            {/* Settings routes */}
            <Route path="settings/venue" element={
              <ProtectedRoute>
                <RegisseurVenueInformation />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute allowedRoles={['regisseur']}>
                <ThemeCustomization />
              </ProtectedRoute>
            } />
            <Route path="settings/theme" element={
              <ProtectedRoute allowedRoles={['regisseur']}>
                <ThemeCustomization />
              </ProtectedRoute>
            } />
            <Route path="venue" element={
              <ProtectedRoute allowedRoles={['intermittent']}>
                <IntermittentVenueInformation />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Unauthorized page */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'dark:bg-dark-800 dark:text-white',
          style: {
            borderRadius: '10px',
            background: '#fff',
            color: '#333',
          },
        }}
      />
    </>
  );
}

export default App;