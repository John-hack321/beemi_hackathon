import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Helper function to get cookie value
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState({
    phase: 'joining', // 'joining' | 'lobby' | 'collecting' | 'selecting' | 'completed'
    currentTurn: 1, // 1 or 2
    story: [],
    audienceWords: [], // Words from audience comments
    currentWordOptions: [], // 4 words for current selection
    scores: { streamer1: 0, streamer2: 0 },
    timer: { remaining: 5, phase: null },
    streamers: {
      1: { name: 'Player 1', connected: false, isHost: false },
      2: { name: 'Player 2', connected: false, isHost: false }
    },
    completedStories: [],
    playerId: null,
    roomCode: getCookie('roomCode') || null,
    wordHistory: new Set(),
    storyLength: 10, // Shorter for testing
    isHost: false
  });

  // Initialize player ID and game state
  useEffect(() => {
    if (!gameState.playerId) {
      const newPlayerId = `player_${Math.random().toString(36).substr(2, 9)}`;
      setGameState(prev => ({
        ...prev,
        playerId: newPlayerId,
        streamers: {
          ...prev.streamers,
          1: {
            ...prev.streamers[1],
            name: localStorage.getItem('playerName') || 'Player 1',
            playerId: newPlayerId
          }
        }
      }));
    }
  }, [gameState.playerId]);

  // Process word selection and update game state
  const processWordSelection = useCallback((prevState, word) => {
    if (!word) return prevState;
    
    const newStory = [...prevState.story, { 
      text: word, 
      streamer: prevState.currentTurn,
      timestamp: new Date().toISOString()
    }];
    
    const newWordHistory = new Set(prevState.wordHistory).add(word.toLowerCase());
    const isStoryComplete = newStory.join(' ').split(' ').length >= prevState.storyLength;
    const nextTurn = prevState.currentTurn === 1 ? 2 : 1;
    
    if (isStoryComplete) {
      return {
        ...prevState,
        story: [],
        phase: 'completed',
        completedStories: [...prevState.completedStories, newStory],
        scores: {
          ...prevState.scores,
          [`streamer${prevState.currentTurn}`]: (prevState.scores[`streamer${prevState.currentTurn}`] || 0) + 1
        },
        wordHistory: newWordHistory,
        timer: { remaining: 0, phase: 'completed' }
      };
    }
    
    return {
      ...prevState,
      story: newStory,
      currentTurn: nextTurn,
      wordHistory: newWordHistory,
      currentWordOptions: [],
      timer: { remaining: 60, phase: 'collecting' }
    };
  }, []);

  // Game timer effect
  useEffect(() => {
    let timer;
    
    if (gameState.phase === 'selecting') {
      timer = setInterval(() => {
        setGameState(prev => {
          if (prev.timer.remaining <= 0) {
            if (prev.currentWordOptions.length > 0) {
              const randomWord = prev.currentWordOptions[Math.floor(Math.random() * prev.currentWordOptions.length)];
              return processWordSelection(prev, randomWord);
            }
            return {
              ...prev,
              phase: 'collecting',
              currentTurn: prev.currentTurn === 1 ? 2 : 1,
              currentWordOptions: []
            };
          }
          return {
            ...prev,
            timer: {
              ...prev.timer,
              remaining: Math.max(0, prev.timer.remaining - 1)
            }
          };
        });
      }, 1000);
    }
    
    return () => timer && clearInterval(timer);
  }, [gameState.phase, processWordSelection]);

  // Create a new game room
  const createRoom = useCallback(async (playerName) => {
    const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    document.cookie = `roomCode=${roomCode};path=/;max-age=86400`;
    
    if (playerName) {
      localStorage.setItem('playerName', playerName);
    }
    
    setGameState(prev => ({
      ...prev,
      roomCode,
      phase: 'lobby',
      isHost: true,
      streamers: {
        ...prev.streamers,
        1: {
          ...prev.streamers[1],
          name: playerName || 'Player 1',
          connected: true,
          isHost: true,
          playerId: prev.playerId
        }
      }
    }));
    
    return roomCode;
  }, []);

  // Join an existing game room
  const joinRoom = useCallback(async (roomCode, playerName) => {
    if (!roomCode) return false;
    
    document.cookie = `roomCode=${roomCode};path=/;max-age=86400`;
    
    if (playerName) {
      localStorage.setItem('playerName', playerName);
    }
    
    setGameState(prev => ({
      ...prev,
      roomCode,
      phase: 'lobby',
      isHost: false,
      streamers: {
        ...prev.streamers,
        2: {
          ...prev.streamers[2],
          name: playerName || 'Player 2',
          connected: true,
          playerId: prev.playerId
        }
      }
    }));
    
    return true;
  }, []);
  
  // Start the game (host only)
  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: 'collecting',
      currentTurn: 1,
      story: [],
      audienceWords: [],
      currentWordOptions: [],
      scores: { streamer1: 0, streamer2: 0 },
      timer: { remaining: 60, phase: 'collecting' }
    }));
  }, []);

  // Add a word suggestion from the audience
  const addAudienceWord = useCallback((word) => {
    if (!word || typeof word !== 'string') return;
    
    // Clean and validate the word
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord || gameState.wordHistory.has(cleanWord)) return;
    
    setGameState(prev => ({
      ...prev,
      audienceWords: [...prev.audienceWords, cleanWord]
    }));
  }, [gameState.wordHistory]);

  // Check if it's the current player's turn
  const isMyTurn = useCallback(() => {
    return gameState.streamers[gameState.currentTurn]?.playerId === gameState.playerId;
  }, [gameState.currentTurn, gameState.streamers, gameState.playerId]);

  // Context value
  const contextValue = {
    gameState,
    startGame,
    addAudienceWord,
    createRoom,
    joinRoom,
    selectWord: (word) => setGameState(prev => processWordSelection(prev, word)),
    isMyTurn,
    currentPlayer: gameState.streamers[gameState.currentTurn],
    otherPlayer: gameState.streamers[gameState.currentTurn === 1 ? 2 : 1],
    isHost: gameState.isHost
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
