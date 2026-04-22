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
window.addEventListener('error', (event: ErrorEvent | any) => {
  const errorMsg = event.message || '';
  const isChunkError = errorMsg.includes('Loading chunk') || 
                       errorMsg.includes('Loading failed') || 
                       errorMsg.includes('Kargatzeak huts egin du');
  
  // Check if it's a script/link loading error (event.target will be the element)
  const isResourceError = event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK');

  if (isChunkError || isResourceError) {
    console.warn('Critical resource load error detected, reloading...', event);
    // Add a flag to avoid infinite reload loops
    const lastReload = sessionStorage.getItem('last_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload) > 5000) {
      sessionStorage.setItem('last_reload', now.toString());
      window.location.reload();
    }
  }
}, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
