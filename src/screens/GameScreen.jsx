import { useEffect, useState, useRef, useCallback } from 'react';
import { useGame } from '../providers/GameProvider';
import { useBeemi } from '../providers/BeemiSDKProvider';
import { useNavigate } from 'react-router-dom';
import StoryDisplay from '../components/StoryDisplay';
import WordOptions from '../components/WordOptions';
import ScoreBoard from '../components/ScoreBoard';
import Timer from '../components/Timer';
import '../styles/GameScreen.css';

const GameScreen = () => {
  const { 
    gameState, 
    selectWord, 
    addWordSuggestion,
    currentPlayer,
    otherPlayer,
    isHost
  } = useGame();
  
  // Helper function to check if it's the current player's turn
  const isMyTurn = useCallback(() => {
    return gameState.streamers[gameState.currentTurn]?.playerId === gameState.playerId;
  }, [gameState.currentTurn, gameState.streamers, gameState.playerId]);
  
  const { beemi } = useBeemi();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ text: '', type: '' });
  const storyEndRef = useRef(null);
  
  // Auto-scroll to bottom of story when it updates
  useEffect(() => {
    if (storyEndRef.current) {
      storyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState.story]);
  
  // Handle game phase changes
  useEffect(() => {
    switch (gameState.phase) {
      case 'collecting':
        displayNotification('Suggest a word to add to the story!', 'info');
        break;
      case 'selecting':
        displayNotification('Vote for your favorite word!', 'info');
        break;
      case 'completed':
        displayNotification('Round complete!', 'success');
        // Navigate to results or next round after a delay
        setTimeout(() => {
          // In a real app, you'd navigate to results or next round
        }, 2000);
        break;
      default:
        break;
    }
  }, [gameState.phase]);
  
  // Show notification message
  const displayNotification = (text, type = 'info') => {
    setNotification({ text, type });
    setShowNotification(true);
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };
  
  // Handle word selection
  const handleWordSelect = useCallback((word) => {
    if (!isMyTurn()) {
      displayNotification("It's not your turn yet!", 'warning');
      return;
    }
    
    try {
      if (gameState.phase === 'collecting') {
        // Submit word suggestion
        addWordSuggestion(word);
        displayNotification('Word submitted!', 'success');
      } else if (gameState.phase === 'selecting') {
        // Submit vote
        selectWord(word);
        displayNotification('Word selected!', 'success');
      }
    } catch (error) {
      console.error('Error handling word selection:', error);
      displayNotification(error.message || 'An error occurred', 'error');
    }
  }, [gameState.phase, isMyTurn, addWordSuggestion, selectWord]);
  
  // Handle chat message submission
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // In a real app, send message via Beemi SDK
    if (beemi) {
      beemi.chat.sendMessage(message);
    }
    
    setMessage('');
  };
  
  // Handle leaving the game
  const handleLeaveGame = useCallback(() => {
    if (window.confirm('Are you sure you want to leave the game?')) {
      if (beemi) {
        beemi.multiplayer.leaveRoom();
      }
      navigate('/');
    }
  }, [beemi, navigate]);
    if (window.confirm('Are you sure you want to leave the game?')) {
      // In a real app, you'd clean up and leave the room
      navigate('/');
    }
  };
  
  // Get current game phase message
  const getPhaseMessage = useCallback(() => {
    switch (gameState.phase) {
      case 'collecting':
        return isMyTurn() 
          ? 'Suggest a word to add to the story!'
          : `Waiting for ${currentPlayer?.name || 'other player'} to suggest a word...`;
      case 'selecting':
        return isMyTurn()
          ? 'Select the next word for the story!'
          : `Waiting for ${currentPlayer?.name || 'other player'} to select a word...`;
      case 'completed':
        return 'Round complete!';
      default:
        return '';
    }
  }, [gameState.phase, isMyTurn, currentPlayer]);

  return (
    <div className="game-screen">
      <div className="game-header">
        <h2>Story Chain</h2>
        <div className="game-info">
          <div className="player-turn">
            {isMyTurn() ? 'Your turn!' : `${currentPlayer?.name || 'Player'}'s turn`}
          </div>
          <div className="phase-message">{getPhaseMessage()}</div>
          <Timer />
          <button 
            className="leave-button"
            onClick={handleLeaveGame}
          >
            Leave Game
          </button>
        </div>
      </div>
      
      <div className="game-content">
        <StoryDisplay story={gameState.story} innerRef={storyEndRef} />
        
        {(gameState.phase === 'collecting' || gameState.phase === 'selecting') && (
          <WordOptions 
            words={gameState.phase === 'collecting' ? [] : gameState.currentWordOptions}
            onSelect={handleWordSelect}
            disabled={!isMyTurn()}
            phase={gameState.phase}
          />
        )}
        
        <ScoreBoard 
          players={[currentPlayer, otherPlayer].filter(Boolean)}
          currentTurn={gameState.currentTurn}
        />
      </div>
      
      {/* Chat section */}
      <div className="chat-container">
        <div className="chat-messages">
          {gameState.chatMessages?.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.isYou ? 'you' : ''}`}>
              <span className="sender">{msg.sender}: </span>
              <span className="message">{msg.text}</span>
            </div>
          ))}
          <div ref={storyEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="chat-input">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={gameState.phase === 'completed'}
          />
          <button 
            type="submit" 
            disabled={!message.trim() || gameState.phase === 'completed'}
          >
            Send
          </button>
        </form>
      </div>
      
      {/* Notification */}
      {showNotification && (
        <div className={`notification ${notification.type}`}>
          {notification.text}
        </div>
      )}
      
      {/* Game over modal */}
      {gameState.phase === 'completed' && (
        <div className="game-overlay">
          <div className="game-over-modal">
            <h2>Round Complete!</h2>
            <div className="final-scores">
              <h3>Final Scores:</h3>
              {[currentPlayer, otherPlayer].filter(Boolean).map((player, index) => (
                <div key={index} className="score-row">
                  <span className="player-name">{player?.name || `Player ${index + 1}`}:</span>
                  <span className="player-score">{player?.score || 0} points</span>
                </div>
              ))}
            </div>
            <div className="game-actions">
              <button 
                className="primary-button"
                onClick={() => window.location.reload()}
              >
                Play Again
              </button>
              <button 
                className="secondary-button"
                onClick={() => navigate('/')}
              >
                Back to Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;