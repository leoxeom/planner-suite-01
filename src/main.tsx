import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App_auth from './App_auth.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App_auth />
  </StrictMode>
);
