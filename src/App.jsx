import { useContext } from 'react';
import JoinScreen from './screens/JoinScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import { GameContext } from './providers/GameProvider';

function App() {
  const { gameState } = useContext(GameContext);

  const renderScreen = () => {
    switch (gameState.phase) {
      case 'joining':
        return <JoinScreen />;
      case 'lobby':
        return <LobbyScreen />;
      case 'collecting':
      case 'selecting':
      case 'completed':
        return <GameScreen />;
      default:
        return <JoinScreen />;
    }
  };

  return (
    <div>
      {renderScreen()}
    </div>
  );
}

export default App;