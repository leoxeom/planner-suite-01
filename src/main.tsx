import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App_simple from './App_simple.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App_simple />
  </StrictMode>
);
