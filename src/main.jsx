import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { GameProvider } from './providers/GameProvider';
import { BeemiSDKProvider } from './providers/BeemiSDKProvider';

// Create root and render the app
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <GameProvider>
        <BeemiSDKProvider>
          <App />
        </BeemiSDKProvider>
      </GameProvider>
    </BrowserRouter>
  </React.StrictMode>
);