import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import App from './App';
import './index.css';
import { GameProvider } from './providers/GameProvider';
import { BeemiSDKProvider } from './providers/BeemiSDKProvider';

// Create a wrapper component that handles the initial navigation
function AppWrapper() {
  const navigate = useNavigate();

  useEffect(() => {
    // Hide the loading screen when the app is mounted
    if (window.hideLoadingScreen) {
      window.hideLoadingScreen();
    }

    // Listen for the startGame event from the landing page button
    const handleStartGame = () => {
      navigate('/');
    };

    window.addEventListener('startGame', handleStartGame);
    
    return () => {
      window.removeEventListener('startGame', handleStartGame);
    };
  }, [navigate]);

  return (
    <GameProvider>
      <BeemiSDKProvider>
        <App />
      </BeemiSDKProvider>
    </GameProvider>
  );
}

// Create root and render the app
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  </React.StrictMode>
);

// Let the index.html know that React is ready
if (window.hideLoadingScreen) {
  window.hideLoadingScreen();
}