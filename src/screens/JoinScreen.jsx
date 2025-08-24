import { useState, useEffect } from 'react';
import { useGame } from '../providers/GameProvider';
import { useBeemi } from '../providers/BeemiSDKProvider';
import { useNavigate } from 'react-router-dom';
import '../styles/JoinScreen.css';

const JoinScreen = () => {
  console.log('Rendering JoinScreen component');
  
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);
  
  const { joinRoom, createRoom, gameState } = useGame();
  const { isConnected } = useBeemi();
  const navigate = useNavigate();
  
  console.log('Game state:', gameState);
  console.log('Is connected to Beemi:', isConnected);
  
  // Auto-focus the player name input on mount
  useEffect(() => {
    const nameInput = document.getElementById('playerName');
    if (nameInput) {
      nameInput.focus();
    }
    
    // Check if we have a room code from URL or cookie
    const params = new URLSearchParams(window.location.search);
    const urlRoomCode = params.get('room');
    if (urlRoomCode) {
      setRoomCode(urlRoomCode.toUpperCase());
    }
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const trimmedName = playerName.trim();
    const trimmedRoomCode = roomCode.trim().toUpperCase();
    
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }
    
    setIsJoining(true);
    
    try {
      // First, join the game in our context
      console.log('Joining game as:', trimmedName);
      
      if (isHost) {
        // Create a new room if host
        console.log('Creating new room...');
        const newRoomCode = await createRoom(trimmedName);
        console.log('Room created with code:', newRoomCode);
        
        if (!newRoomCode) {
          throw new Error('Failed to create room. Please try again.');
        }
        
        console.log('Navigating to lobby...');
        navigate('/lobby');
      } else if (trimmedRoomCode) {
        // Join existing room if room code is provided
        console.log('Joining room:', trimmedRoomCode);
        const joinSuccess = await joinRoom(trimmedRoomCode, trimmedName);
        
        if (joinSuccess) {
          console.log('Successfully joined room, navigating to lobby...');
          navigate('/lobby');
        } else {
          throw new Error('Failed to join room. Please check the room code and try again.');
        }
      } else {
        throw new Error('Please enter a room code or create a new game');
      }
      
    } catch (err) {
      console.error('Error in game setup:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };
  
  const toggleHostMode = () => {
    setIsHost(!isHost);
    setRoomCode('');
  };

  return (
    <div className="join-screen">
      <div className="join-container">
        <h1>Story Chain</h1>
        <p className="subtitle">Create a story one word at a time with friends</p>
        
        {!isConnected ? (
          <div className="connection-status">
            <div className="spinner"></div>
            <p>Connecting to game server...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="join-form">
            <div className="form-group">
              <label htmlFor="playerName">Your Name</label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                disabled={isJoining}
              />
            </div>
            
            {!isHost && (
              <div className="form-group">
                <label htmlFor="roomCode">Room Code</label>
                <input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter room code"
                  maxLength={6}
                  disabled={isJoining || isHost}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            )}
            
            <div className="host-toggle">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={isHost}
                  onChange={toggleHostMode}
                  disabled={isJoining}
                />
                <span className="slider round"></span>
              </label>
              <span>{isHost ? 'Creating New Room' : 'Join Existing Room'}</span>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              type="submit" 
              className="join-button"
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <span className="spinner small"></span>
                  {isHost ? 'Creating Room...' : 'Joining...'}
                </>
              ) : isHost ? (
                'Create Room'
              ) : (
                'Join Room'
              )}
            </button>
          </form>
        )}
        
        <div className="game-instructions">
          <h3>How to Play</h3>
          <ol>
            <li>Join or create a room</li>
            <li>Invite friends with the room code</li>
            <li>Take turns adding words to the story</li>
            <li>Earn points for creative contributions</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default JoinScreen;