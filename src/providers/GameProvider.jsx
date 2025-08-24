import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  console.log('Initializing GameProvider');
  
  const [gameState, setGameState] = useState({
    phase: 'joining', // 'joining' | 'lobby' | 'collecting' | 'selecting' | 'completed'
    currentTurn: 1, // 1 or 2
    story: [],
    audienceWords: [], // Words from audience comments
    currentWordOptions: [], // 4 words for current selection
    scores: { streamer1: 0, streamer2: 0 },
    timer: { remaining: 5, phase: null }, // 5 seconds for word selection
    streamers: {
      1: { name: 'Streamer 1', connected: false, isHost: false },
      2: { name: 'Streamer 2', connected: false, isHost: false }
    },
    completedStories: [],
    playerId: null,
    roomCode: getCookie('roomCode') || null,
    wordHistory: new Set(), // Track used words to avoid repetition
    storyLength: 100 // Target story length
  });

  // Generate a unique player ID if not exists
  useEffect(() => {
    console.log('Checking player ID in GameProvider');
    if (!gameState.playerId) {
      const newPlayerId = `player_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Generated new player ID:', newPlayerId);
      setGameState(prev => ({
        ...prev,
        playerId: newPlayerId
      }));
    }
  }, [gameState.playerId]);
  
  console.log('Current game state in GameProvider:', gameState);

  // Game timer effect
  useEffect(() => {
    let timer;
    
    if (gameState.phase === 'selecting') {
      timer = setInterval(() => {
        setGameState(prev => {
          if (prev.timer.remaining <= 0) {
            // Auto-select a word if time runs out
            if (prev.currentWordOptions.length > 0) {
              const randomWord = prev.currentWordOptions[Math.floor(Math.random() * prev.currentWordOptions.length)];
              return processWordSelection(prev, randomWord);
            } else {
              // If no words available, just move to next turn
              return {
                ...prev,
                phase: 'collecting',
                currentTurn: prev.currentTurn === 1 ? 2 : 1,
                timer: { remaining: 0, phase: 'collecting' },
                currentWordOptions: []
              };
            }
          }
          
          // Decrement timer if still running
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
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState.phase]);
  
  // Process word selection and update game state
  const processWordSelection = useCallback((prevState, word) => {
    if (!word) return prevState;
    
    const newStory = [...prevState.story, { 
      text: word, 
      streamer: prevState.currentTurn,
      timestamp: new Date().toISOString()
    }];
    
    // Add to word history to avoid repetition
    const newWordHistory = new Set(prevState.wordHistory).add(word.toLowerCase());
    
    // Check if story is complete
    if (newStory.length >= prevState.storyLength) {
      const newCompletedStories = [...prevState.completedStories, newStory];
      return {
        ...prevState,
        story: newStory,
        phase: 'completed',
        completedStories: newCompletedStories,
        timer: { remaining: 0, phase: 'completed' },
        wordHistory: newWordHistory
      };
    }
    
    // Continue to next turn
    return {
      ...prevState,
      story: newStory,
      phase: 'collecting',
      currentTurn: prevState.currentTurn === 1 ? 2 : 1,
      currentWordOptions: [],
      audienceWords: [],
      wordHistory: newWordHistory,
      timer: { remaining: 5, phase: 'selecting' }
    };
  }, []);

  // List of profane words to filter out
  const profaneWords = new Set([
    'badword1', 'badword2', 'profanity', 'inappropriate', 'offensive',
    'explicit', 'nsfw', 'vulgar', 'curse', 'swear', 'obscene'
  ]);

  // Add a word suggestion from audience chat
  const addAudienceWord = useCallback((word) => {
    if (!word || typeof word !== 'string') return;
    
    // Clean and validate the word
    const cleanWord = word.trim().toLowerCase();
    
    // Skip if word is empty, too long, contains numbers/special chars, or already used
    if (
      !cleanWord || 
      cleanWord.length > 20 || 
      /[^a-zA-Z]/.test(cleanWord) ||
      profaneWords.has(cleanWord) ||
      gameState.wordHistory.has(cleanWord) ||
      gameState.audienceWords.includes(cleanWord)
    ) {
      return;
    }
    
    setGameState(prev => {
      // Only add words during collecting phase
      if (prev.phase !== 'collecting') return prev;
      
      const newAudienceWords = [...prev.audienceWords, cleanWord];
      
      // When we have 4 words, move to selection phase
      if (newAudienceWords.length >= 4) {
        return {
          ...prev,
          phase: 'selecting',
          currentWordOptions: newAudienceWords.slice(0, 4),
          audienceWords: [],
          timer: { remaining: 5, phase: 'selecting' }
        };
      }
      
      return { 
        ...prev,
        audienceWords: newAudienceWords
      };
    });
  }, [gameState.wordHistory, gameState.audienceWords, gameState.phase]);

  // Select a word for the story
  const selectWord = useCallback((word) => {
    if (!word) return;
    setGameState(prev => processWordSelection(prev, word));
  }, [processWordSelection]);

  // Join the game as a player
  const joinGame = useCallback((playerName) => {
    setGameState(prev => {
      const newStreamers = { ...prev.streamers };
      let joined = false;
      
      if (!newStreamers[1].connected) {
        newStreamers[1] = { 
          name: playerName || 'Streamer 1', 
          connected: true,
          playerId: prev.playerId,
          isHost: true // First player is host
        };
        joined = true;
      } else if (!newStreamers[2].connected) {
        newStreamers[2] = { 
          name: playerName || 'Streamer 2', 
          connected: true,
          playerId: prev.playerId,
          isHost: false
        };
        joined = true;
      }
      
      return { 
        ...prev, 
        streamers: newStreamers, 
        phase: joined ? 'lobby' : prev.phase
      };
    });
  }, []);
  
  // Create a new game room
  const createRoom = useCallback(() => {
    const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    document.cookie = `roomCode=${roomCode};path=/;max-age=86400`; // 24h expiry
    
    setGameState(prev => ({
      ...prev,
      roomCode,
      phase: 'lobby',
      isHost: true
    }));
    
    return roomCode;
  }, []);
  
  // Join an existing room
  const joinRoom = useCallback((roomCode) => {
    if (!roomCode) return false;
    
    document.cookie = `roomCode=${roomCode};path=/;max-age=86400`; // 24h expiry
    
    setGameState(prev => ({
      ...prev,
      roomCode,
      phase: 'lobby',
      isHost: false
    }));
    
    return true;
  }, []);

  // Start the game
  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: 'collecting',
      story: [],
      scores: { streamer1: 0, streamer2: 0 },
      wordHistory: new Set(),
      audienceWords: [],
      currentWordOptions: [],
      timer: { remaining: 0, phase: 'collecting' }
    }));
  }, []);

  // Context value
  const contextValue = {
    gameState,
    // Game actions
    startGame,
    addAudienceWord,
    selectWord,
    joinGame,
    createRoom,
    joinRoom,
    // Derived state
    isHost: gameState.streamers[1]?.isHost || false,
    currentPlayer: gameState.streamers[gameState.currentTurn],
    otherPlayer: gameState.streamers[gameState.currentTurn === 1 ? 2 : 1]
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);