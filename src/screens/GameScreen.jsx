import { useGame } from '../providers/GameProvider';
import StoryDisplay from '../components/StoryDisplay';
import WordOptions from '../components/WordOptions';
import Timer from '../components/Timer';
import ScoreBoard from '../components/ScoreBoard';

const GameScreen = () => {
  const { gameState, selectWord } = useGame();

  return (
    <div className="game-screen">
      <ScoreBoard scores={gameState.scores} />
      <StoryDisplay story={gameState.story} />
      <WordOptions
        words={gameState.currentWordOptions}
        onSelect={selectWord}
        timeRemaining={gameState.timer.remaining}
        canSelect={gameState.phase === 'selecting'}
      />
      <Timer timeRemaining={gameState.timer.remaining} />
    </div>
  );
};

export default GameScreen;