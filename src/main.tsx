import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Handle any third-party cross-origin script errors or unhandled rejections gracefully
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // Check for generic cross-origin Script error
    if (event.message === 'Script error.' || event.message?.includes('Script error')) {
      console.warn('Cross-origin script event intercepted:', event);
      event.preventDefault();
      return true;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('Script error') || event.reason?.message?.includes('Loading chunk')) {
      console.warn('Unhandled rejection intercepted:', event.reason);
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
