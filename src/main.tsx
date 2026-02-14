import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

try {
  console.log('🚀 App starting...');
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (e) {
  console.error('Failed to render app:', e);
  document.body.innerHTML = `<div style="color: red; padding: 20px;"><h1>Application Error</h1><pre>${e instanceof Error ? e.message : JSON.stringify(e)}</pre></div>`;
}
