import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.error('Service Worker registration failed:', error);
    });
  });
}

// Global error handler to catch chunk load failures
window.addEventListener('error', (event) => {
  const errorMsg = event.message || '';
  if (errorMsg.includes('Loading chunk') || errorMsg.includes('Loading failed')) {
    console.warn('Chunk load error detected, reloading...', event);
    window.location.reload();
  }
}, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
