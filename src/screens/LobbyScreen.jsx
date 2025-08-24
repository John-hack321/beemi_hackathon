import { useEffect, useState, useCallback } from 'react';
import { useGame } from '../providers/GameProvider';
import { useBeemi } from '../providers/BeemiSDKProvider';
import { useNavigate } from 'react-router-dom';
import '../styles/LobbyScreen.css';

const LobbyScreen = () => {
  const { gameState, startWordCollection } = useGame();
  const { beemi, sendChatMessage } = useBeemi();
  const navigate = useNavigate();
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [players, setPlayers] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [gameStarting, setGameStarting] = useState(false);

  // Generate invite link
  useEffect(() => {
    if (gameState.roomCode) {
      const url = new URL(window.location.href);
      url.searchParams.set('room', gameState.roomCode);
      setInviteLink(url.toString());
    }
  }, [gameState.roomCode]);

  // Set up player list from game state
  useEffect(() => {
    const playerList = [];
    
    // Add streamer 1 if connected
    if (gameState.streamers[1]?.connected) {
      playerList.push({
        id: 1,
        name: gameState.streamers[1].name || 'Player 1',
        isHost: gameState.isHost,
        isReady: playerReady && gameState.streamers[1].playerId === gameState.playerId,
        isYou: gameState.streamers[1].playerId === gameState.playerId
      });
    }
    
    // Add streamer 2 if connected
    if (gameState.streamers[2]?.connected) {
      playerList.push({
        id: 2,
        name: gameState.streamers[2].name || 'Player 2',
        isHost: !gameState.isHost,
        isReady: playerReady && gameState.streamers[2].playerId === gameState.playerId,
        isYou: gameState.streamers[2].playerId === gameState.playerId
      });
    }
    
    setPlayers(playerList);
    
    // Auto-start game if we're in development and both players are ready
    if (process.env.NODE_ENV === 'development' && playerList.length >= 2 && playerList.every(p => p.isReady)) {
      console.log('All players ready, starting game...');
      setTimeout(() => startGame(), 1000);
    }
  }, [gameState, playerReady]);

  // Handle copy invite link
  const copyInviteLink = () => {
    if (!inviteLink) return;
    
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Toggle player ready status
  const toggleReady = () => {
    const newReadyState = !playerReady;
    setPlayerReady(newReadyState);
    
    // In a real app, you would notify other players about the ready status
    if (beemi) {
      beemi.multiplayer.sendRoomEvent({
        type: 'playerReady',
        playerId: gameState.playerId,
        isReady: newReadyState
      });
    }
  };

  // Start the game (host only)
  const startGame = useCallback(() => {
    if (gameStarting) return;
    
    if (gameState.isHost) {
      console.log('Host is starting the game...');
      
      // Notify other players the game is starting
      if (beemi) {
        beemi.multiplayer.sendRoomEvent({
          type: 'gameStarting',
          countdown: 5
        });
      }
      
      // Start countdown for everyone
      startCountdown(beemi ? 5 : 2);
    } else {
      console.log('Only the host can start the game');
    }
  }, [beemi, gameState.isHost, gameStarting]);
  
  // Handle game start event from host
  useEffect(() => {
    if (!beemi) return;
    
    const handleGameStarting = (event) => {
      if (event.type === 'gameStarting') {
        console.log('Game starting in', event.countdown, 'seconds');
        startCountdown(event.countdown);
      }
    };
    
    beemi.multiplayer.on('roomEvent', handleGameStarting);
    
    return () => {
      beemi.multiplayer.off('roomEvent', handleGameStarting);
    };
  }, [beemi]);

  // Start countdown to game start
  const startCountdown = useCallback((seconds) => {
    setGameStarting(true);
    let count = seconds;
    
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count <= 0) {
        clearInterval(timer);
        // Start the game
        if (typeof startWordCollection === 'function') {
          startWordCollection();
        }
        navigate('/game');
      }
    }, 1000);
    
    // Cleanup function
    return () => clearInterval(timer);
  }, [navigate, startWordCollection]);

  // Handle room events
  useEffect(() => {
    if (!beemi) return;
    
    const handleRoomEvent = (event) => {
      if (event.type === 'gameStarting' && event.countdown) {
        setGameStarting(true);
        setCountdown(event.countdown);
        
        // Start local countdown
        let count = event.countdown;
        const timer = setInterval(() => {
          count--;
          setCountdown(count);
          
          if (count <= 0) {
            clearInterval(timer);
            startWordCollection();
            navigate('/game');
          }
        }, 1000);
      }
    };
    
    beemi.multiplayer.on('room-event', handleRoomEvent);
    
    return () => {
      beemi.multiplayer.off('room-event', handleRoomEvent);
    };
  }, [beemi, navigate, startWordCollection]);

  // Check if all players are ready
  const allPlayersReady = players.length > 0 && players.every(p => p.isReady);
  const canStartGame = gameState.isHost && allPlayersReady && players.length >= 2;

  return (
    <div className="lobby-screen">
      <div className="lobby-container">
        <h1>Game Lobby</h1>
        <p className="room-code">Room Code: <span>{gameState.roomCode}</span></p>
        
        <div className="invite-section">
          <p>Invite a friend to join:</p>
          <div className="invite-link">
            <input 
              type="text" 
              value={inviteLink} 
              readOnly 
              onClick={(e) => e.target.select()}
            />
            <button 
              className={`copy-button ${copied ? 'copied' : ''}`}
              onClick={copyInviteLink}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        <div className="player-list">
          <h3>Players ({players.length}/2)</h3>
          <ul>
            {players.map(player => (
              <li key={player.id} className={`player ${player.isReady ? 'ready' : ''}`}>
                <span className="player-name">
                  {player.name}
                  {player.isHost && <span className="host-badge">Host</span>}
                </span>
                <span className="player-status">
                  {player.isReady ? (
                    <span className="ready-status">Ready</span>
                  ) : (
                    <span className="not-ready-status">Not Ready</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          
          {players.length < 2 && (
            <p className="waiting-message">Waiting for another player to join...</p>
          )}
        </div>
        
        <div className="ready-section">
          <button 
            className={`ready-button ${playerReady ? 'ready' : ''}`}
            onClick={toggleReady}
            disabled={gameStarting}
          >
            {playerReady ? 'Not Ready' : 'I\'m Ready'}
          </button>
        </div>
        
        {gameStarting ? (
          <div className="countdown-overlay">
            <div className="countdown-box">
              <div className="countdown-number">{countdown}</div>
              <p>Game starting in...</p>
            </div>
          </div>
        ) : (
          gameState.isHost && (
            <button 
              className="start-button"
              onClick={startGame}
              disabled={!canStartGame || gameStarting}
            >
              Start Game
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default LobbyScreen;