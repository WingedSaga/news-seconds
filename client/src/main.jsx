import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// На GitHub Pages приложение живёт в подпапке — берём префикс из base Vite.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

// На слабых устройствах эффекты не важнее скорости чтения ленты. Браузер сообщает
// об экономии трафика или небольшом числе ядер — в этом случае CSS отключит тяжёлые эффекты.
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
if (connection?.saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)) {
  document.documentElement.classList.add('low-power');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
