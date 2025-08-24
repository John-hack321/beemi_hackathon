import React from 'react';

const StatusBar = ({ gamePhase, turn }) => {
  return (
    <div className="status-bar">
      <p>Game Phase: {gamePhase}</p>
      <p>Current Turn: Streamer {turn}</p>
    </div>
  );
};

export default StatusBar;
