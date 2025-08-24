import { useEffect, useState, useRef } from 'react';
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
    submitWordSuggestion,
    submitVote,
    getCurrentPlayer,
    isMyTurn
  } = useGame();
  
  const { beemi } = useBeemi();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ text: '', type: '' });
  const storyEndRef = useRef(null);
  
  const currentPlayer = getCurrentPlayer();
  
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
  const handleWordSelect = (word) => {
    if (!isMyTurn()) return;
    
    if (gameState.phase === 'collecting') {
      // Submit word suggestion
      submitWordSuggestion(word);
      displayNotification('Word submitted!', 'success');
    } else if (gameState.phase === 'selecting') {
      // Submit vote
      submitVote(word);
      displayNotification('Vote submitted!', 'success');
    }
  };
  
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
  const handleLeaveGame = () => {
    if (window.confirm('Are you sure you want to leave the game?')) {
      // In a real app, you'd clean up and leave the room
      navigate('/');
    }
  };
  
  return (
    <div className="game-screen">
      {/* Header */}
      <header className="game-header">
        <div className="header-left">
          <button className="leave-button" onClick={handleLeaveGame}>
            ← Leave Game
          </button>
        </div>
        <div className="header-center">
          <h1>Story Chain</h1>
          <div className="game-phase">
            {gameState.phase === 'collecting' && 'Suggest Words'}
            {gameState.phase === 'selecting' && 'Vote for Words'}
            {gameState.phase === 'completed' && 'Round Complete'}
          </div>
        </div>
        <div className="header-right">
          <Timer />
        </div>
      </header>
      
      <div className="game-layout">
        {/* Left sidebar - Scoreboard */}
        <aside className="game-sidebar">
          <ScoreBoard />
        </aside>
        
        {/* Main game area */}
        <main className="game-main">
          {/* Story display */}
          <div className="story-container">
            <StoryDisplay innerRef={storyEndRef} />
          </div>
          
          {/* Word options */}
          <div className="word-options-container">
            <WordOptions onSelect={handleWordSelect} />
          </div>
          
          {/* Current turn indicator */}
          <div className="turn-indicator">
            {isMyTurn() ? (
              <div className="your-turn">Your turn!</div>
            ) : (
              <div className="their-turn">
                {currentPlayer?.name || 'Player'}'s turn
              </div>
            )}
          </div>
        </main>
        
        {/* Right sidebar - Chat */}
        <aside className="chat-sidebar">
          <h3>Chat</h3>
          <div className="chat-messages">
            {gameState.chatMessages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.isSystem ? 'system' : ''}`}>
                <span className="sender">{msg.sender}:</span> {msg.text}
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
              disabled={!beemi}
            />
            <button type="submit" disabled={!message.trim() || !beemi}>
              Send
            </button>
          </form>
        </aside>
      </div>
      
      {/* Notification */}
      {showNotification && (
        <div className={`notification ${notification.type}`}>
          {notification.text}
        </div>
      )}
      
      {/* Game overlay for completed rounds */}
      {gameState.phase === 'completed' && (
        <div className="game-overlay">
          <div className="game-overlay-content">
            <h2>Round Complete!</h2>
            <p>The winning word was: <strong>{gameState.winningWord}</strong></p>
            <div className="score-summary">
              <h3>Scores:</h3>
              {Object.entries(gameState.scores).map(([playerId, score]) => (
                <div key={playerId} className="score-summary-item">
                  <span className="player-name">
                    {gameState.players[playerId]?.name || `Player ${playerId}`}:
                  </span>
                  <span className="player-score">{score} points</span>
                </div>
              ))}
            </div>
            <button 
              className="next-round-button"
              onClick={() => {
                // In a real app, you'd start the next round
                console.log('Starting next round...');
              }}
            >
              Next Round
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;