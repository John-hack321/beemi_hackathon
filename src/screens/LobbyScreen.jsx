import { useGame } from '../providers/GameProvider';

const LobbyScreen = () => {
  const { gameState, startWordCollection } = useGame();

  return (
    <div className="lobby-screen">
      <h1>Lobby</h1>
      <p>Waiting for players...</p>
      <p>Streamer 1: {gameState.streamers[1].name}</p>
      <p>Streamer 2: {gameState.streamers[2].name}</p>
      {gameState.streamers[1].connected && gameState.streamers[2].connected && (
        <button onClick={startWordCollection}>Start Game</button>
      )}
    </div>
  );
};

export default LobbyScreen;