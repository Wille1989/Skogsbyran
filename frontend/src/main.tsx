import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './app/App.tsx'
import { recordEvent } from './modules/analytics/data/api'

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
