import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './app/App.tsx'
import { recordEvent } from './modules/analytics/data/api'

// Bootstrap once, outside React effects. Development never installs a worker.
if (import.meta.env.PROD && window.isSecureContext && 'serviceWorker' in navigator) {
  const register = () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(error => console.warn('PWA registration failed:', error));
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

// Once per public document load, outside React's StrictMode effect replay.
if (!/^\/admin(?:\/|$)/i.test(window.location.pathname)) {
  recordEvent({ event_type: "visitor" });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
