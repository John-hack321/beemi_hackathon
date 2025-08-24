import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import JoinScreen from './screens/JoinScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import { GameContext } from './providers/GameProvider';

function App() {
  const { gameState } = useContext(GameContext);

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (gameState.phase === 'joining' && !gameState.roomCode) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

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