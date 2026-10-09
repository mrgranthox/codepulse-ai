import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Handle any third-party browser extensions, cross-origin script errors or unhandled rejections gracefully
if (typeof window !== 'undefined') {
  const isExtensionOrScriptError = (msg?: string, filename?: string) => {
    if (!msg) return false;
    const lowerMsg = msg.toLowerCase();
    const lowerFile = (filename || '').toLowerCase();
    return (
      lowerMsg.includes('script error') ||
      lowerMsg.includes('cannot set property fetch') ||
      lowerMsg.includes('fetch of #<window>') ||
      lowerFile.includes('chrome-extension://') ||
      lowerFile.includes('moz-extension://')
    );
  };

  window.addEventListener('error', (event) => {
    if (isExtensionOrScriptError(event.message, event.filename)) {
      console.warn('Browser extension or script error suppressed:', event.message);
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason?.message || String(event.reason || '');
    if (isExtensionOrScriptError(reasonMsg)) {
      console.warn('Unhandled extension rejection suppressed:', reasonMsg);
      event.preventDefault();
      event.stopPropagation();
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
