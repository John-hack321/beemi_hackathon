import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

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
    wordSuggestions: new Map(), // word -> count
    currentWordOptions: [], // top 4 words
    scores: { streamer1: 0, streamer2: 0 },
    timer: { remaining: 0, phase: null },
    streamers: {
      1: { name: 'Streamer 1', connected: false },
      2: { name: 'Streamer 2', connected: false }
    },
    completedStories: [],
    playerId: null,
    roomCode: getCookie('roomCode') || null
  });

  // Generate a unique player ID if not exists
  useEffect(() => {
    if (!gameState.playerId) {
      setGameState(prev => ({
        ...prev,
        playerId: `player_${Math.random().toString(36).substr(2, 9)}`
      }));
    }
  }, [gameState.playerId]);

  // Game timer effect
  useEffect(() => {
    let timer;
    
    if (gameState.phase === 'collecting' || gameState.phase === 'selecting') {
      timer = setInterval(() => {
        setGameState(prev => {
          if (prev.timer.remaining <= 0) {
            if (prev.phase === 'collecting') {
              // Process collected words
              const sortedWords = [...prev.wordSuggestions.entries()]
                .sort((a, b) => b[1] - a[1])
                .filter(([word]) => word && word.trim().length > 0);
              
              let topWords = sortedWords.slice(0, 4).map(item => item[0]);
              
              // Fill with seed words if needed
              if (topWords.length < 4) {
                const seedWords = ['and', 'the', 'a', 'is'];
                topWords = [...topWords, ...seedWords.slice(0, 4 - topWords.length)];
              }
              
              return { 
                ...prev, 
                phase: 'selecting', 
                currentWordOptions: topWords, 
                timer: { remaining: 10, phase: 'selecting' },
                // Reset suggestions for the next round
                wordSuggestions: new Map()
              };
            } else if (prev.phase === 'selecting') {
              // Auto-select a word if time runs out
              const randomWord = prev.currentWordOptions[Math.floor(Math.random() * prev.currentWordOptions.length)];
              return processWordSelection(prev, randomWord);
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
    
    const newScores = { ...prevState.scores };
    const timeBonus = prevState.timer.remaining > 2 ? 2 : 0;
    const wordScore = 10 + timeBonus;
    newScores[`streamer${prevState.currentTurn}`] += wordScore;
    
    // Check if story is complete
    if (newStory.length >= 15) {
      const newCompletedStories = [...prevState.completedStories, newStory];
      return {
        ...prevState,
        story: newStory,
        scores: newScores,
        phase: 'completed',
        completedStories: newCompletedStories,
        timer: { remaining: 0, phase: 'completed' }
      };
    }
    
    // Continue to next turn
    return {
      ...prevState,
      story: newStory,
      scores: newScores,
      phase: 'collecting',
      currentTurn: prevState.currentTurn === 1 ? 2 : 1,
      wordSuggestions: new Map(),
      currentWordOptions: [],
      timer: { remaining: 30, phase: 'collecting' }
    };
  }, []);

  // Start the word collection phase
  const startWordCollection = useCallback(() => {
    setGameState(prev => ({ 
      ...prev, 
      phase: 'collecting', 
      timer: { remaining: 30, phase: 'collecting' },
      story: [],
      wordSuggestions: new Map(),
      currentWordOptions: [],
      scores: { streamer1: 0, streamer2: 0 }
    }));
  }, []);

  // List of profane words to filter out
  const profaneWords = new Set([
    'badword1', 'badword2', 'profanity', 'inappropriate', 'offensive',
    'explicit', 'nsfw', 'vulgar', 'curse', 'swear', 'obscene'
  ]);

  // Add a word suggestion from chat
  const addWordSuggestion = useCallback((word) => {
    if (!word || typeof word !== 'string') return;
    
    // Clean and validate the word
    const cleanWord = word.trim().toLowerCase();
    
    // Skip if word is empty, too long, or contains numbers/special chars
    if (
      !cleanWord || 
      cleanWord.length > 20 || 
      /[^a-zA-Z]/.test(cleanWord) ||
      profaneWords.has(cleanWord)
    ) {
      return;
    }
    
    setGameState(prev => {
      // Only add words during collection phase
      if (prev.phase !== 'collecting') return prev;
      
      const newSuggestions = new Map(prev.wordSuggestions);
      const currentCount = newSuggestions.get(cleanWord) || 0;
      newSuggestions.set(cleanWord, currentCount + 1);
      
      return { 
        ...prev, 
        wordSuggestions: newSuggestions 
      };
    });
  }, []);

  // Select a word for the story
  const selectWord = useCallback((word) => {
    if (!word) return;
    
    setGameState(prev => processWordSelection(prev, word));
  }, [processWordSelection]);

  // Switch turns between players
  const switchTurn = useCallback(() => {
    setGameState(prev => ({ 
      ...prev, 
      currentTurn: prev.currentTurn === 1 ? 2 : 1 
    }));
  }, []);

  // Join the game as a player
  const joinGame = useCallback((playerName) => {
    setGameState(prev => {
      const newStreamers = { ...prev.streamers };
      let joined = false;
      
      if (!newStreamers[1].connected) {
        newStreamers[1] = { 
          name: playerName || 'Streamer 1', 
          connected: true,
          playerId: prev.playerId
        };
        joined = true;
      } else if (!newStreamers[2].connected) {
        newStreamers[2] = { 
          name: playerName || 'Streamer 2', 
          connected: true,
          playerId: prev.playerId
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

  // Context value
  const contextValue = {
    gameState,
    // Game actions
    startWordCollection,
    addWordSuggestion,
    selectWord,
    switchTurn,
    joinGame,
    createRoom,
    joinRoom,
    // Derived state
    isHost: gameState.isHost,
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