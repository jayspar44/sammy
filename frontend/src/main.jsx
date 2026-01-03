import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Global error trap for mobile debugging
window.onerror = function (msg, url, line, col, error) {
  alert("Global Error: " + msg + "\n" + url + ":" + line + ":" + col);
  return false;
};
window.addEventListener('unhandledrejection', function (event) {
  alert("Unhandled Rejection: " + event.reason);
});


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
