
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
// Fuentes servidas desde la propia web (sin enviar la IP de los visitantes a Google).
import '@fontsource-variable/inter';
import '@fontsource-variable/bricolage-grotesque';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
