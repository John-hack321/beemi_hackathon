import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { GameProvider } from './providers/GameProvider';
import { BeemiSDKProvider } from './providers/BeemiSDKProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
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