import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {isNativeApp} from './config/runtime';
import {registerSW} from 'virtual:pwa-register';

if (!isNativeApp) {
  registerSW({ immediate: false });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
