import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {isNativeApp} from './config/runtime';
import {registerSW} from 'virtual:pwa-register';

if (!isNativeApp && import.meta.env.DEV && 'serviceWorker' in navigator) {
  const reloadMarker = 'catraca:development-sw-cleanup';
  const wasControlled = Boolean(navigator.serviceWorker.controller);

  void Promise.all([
    navigator.serviceWorker.getRegistrations().then((registrations) =>
      Promise.all(registrations.map((registration) => registration.unregister())),
    ),
    'caches' in window
      ? caches.keys().then((cacheNames) => Promise.all(cacheNames
        .filter((name) => name.includes('workbox') || name.includes('precache'))
        .map((name) => caches.delete(name))))
      : Promise.resolve([]),
  ]).then(() => {
    if (wasControlled && sessionStorage.getItem(reloadMarker) !== 'done') {
      sessionStorage.setItem(reloadMarker, 'done');
      window.location.reload();
      return;
    }
    sessionStorage.removeItem(reloadMarker);
  });
} else if (!isNativeApp) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
