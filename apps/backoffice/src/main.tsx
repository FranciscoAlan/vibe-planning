import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BackofficeApp } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BackofficeApp />
  </StrictMode>,
);
