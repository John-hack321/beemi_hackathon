import { useGame } from '../providers/GameProvider';

const JoinScreen = () => {
  const { joinGame } = useGame();

  return (
    <div className="join-screen">
      <h1>Join Game</h1>
      <button onClick={joinGame}>Join</button>
    </div>
  );
};

export default JoinScreen;