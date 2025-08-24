import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import JoinScreen from './screens/JoinScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import { GameContext } from './providers/GameProvider';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { gameState } = useContext(GameContext);
  const location = useLocation();

  if (gameState.phase === 'joining' && !gameState.roomCode) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<JoinScreen />} />
        <Route
          path="/lobby"
          element={
            <ProtectedRoute>
              <LobbyScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <GameScreen />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;