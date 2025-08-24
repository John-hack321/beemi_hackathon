import { Switch, Route, Redirect } from 'react-router-dom';
import { useContext } from 'react';
import JoinScreen from './screens/JoinScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import { GameContext } from './providers/GameProvider';

function App() {
  const { gameState } = useContext(GameContext);

  // Protected route component
  const ProtectedRoute = ({ children, ...rest }) => {
    return (
      <Route
        {...rest}
        render={({ location }) =>
          gameState.phase !== 'joining' || gameState.roomCode ? (
            children
          ) : (
            <Redirect to={{ pathname: "/", state: { from: location } }} />
          )
        }
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Switch>
        <Route exact path="/" component={JoinScreen} />
        <ProtectedRoute path="/lobby">
          <LobbyScreen />
        </ProtectedRoute>
        <ProtectedRoute path="/game">
          <GameScreen />
        </ProtectedRoute>
        <Redirect to="/" />
      </Switch>
    </div>
  );
}

export default App;