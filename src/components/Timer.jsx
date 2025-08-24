const Timer = ({ timeRemaining }) => {
  return (
    <div className="timer-container">
      <p>Time Remaining: {timeRemaining}s</p>
    </div>
  );
};

export default Timer;