const ScoreBoard = ({ scores }) => {
  return (
    <div className="scoreboard">
      <h2>Scoreboard</h2>
      <p>Streamer 1: {scores.streamer1}</p>
      <p>Streamer 2: {scores.streamer2}</p>
    </div>
  );
};

export default ScoreBoard;