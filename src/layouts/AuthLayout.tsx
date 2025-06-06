import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 to-dark-950 relative overflow-hidden">
      <Outlet />
    </div>
  );
};