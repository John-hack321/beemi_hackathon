import React, { createContext, useState, useContext } from 'react';

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
      1: { name: '', connected: false },
      2: { name: '', connected: false }
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (gameState.timer.remaining > 0) {
        setGameState(prev => ({ ...prev, timer: { ...prev.timer, remaining: prev.timer.remaining - 1 } }));
      } else {
        if (gameState.phase === 'collecting') {
          const sortedWords = [...gameState.wordSuggestions.entries()].sort((a, b) => b[1] - a[1]);
          let topWords = sortedWords.slice(0, 4).map(item => item[0]);
          if (topWords.length < 4) {
            const seedWords = ['and', 'the', 'a', 'is'];
            topWords = [...topWords, ...seedWords.slice(0, 4 - topWords.length)];
          }
          setGameState(prev => ({ ...prev, phase: 'selecting', currentWordOptions: topWords, timer: { remaining: 5, phase: 'selecting' } }));
        } else if (gameState.phase === 'selecting') {
          const randomWord = gameState.currentWordOptions[Math.floor(Math.random() * gameState.currentWordOptions.length)];
          selectWord(randomWord);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState.timer, gameState.phase, gameState.wordSuggestions, gameState.currentWordOptions]);

  const startWordCollection = () => {
    setGameState(prev => ({ ...prev, phase: 'collecting', timer: { remaining: 15, phase: 'collecting' } }));
  };

  const profaneWords = ['badword1', 'badword2']; // Add more words as needed

  const addWordSuggestion = (word) => {
    if (profaneWords.includes(word)) {
      return;
    }
    setGameState(prev => {
      const newSuggestions = new Map(prev.wordSuggestions);
      newSuggestions.set(word, (newSuggestions.get(word) || 0) + 1);
      return { ...prev, wordSuggestions: newSuggestions };
    });
  };

  const selectWord = (word) => {
    setGameState(prev => {
      const newStory = [...prev.story, { text: word, streamer: prev.currentTurn }];
      const newScores = { ...prev.scores };
      const timeBonus = prev.timer.remaining > 2 ? 2 : 0;
      newScores[`streamer${prev.currentTurn}`] += 10 + timeBonus;

      if (newStory.length >= 15) {
        const newCompletedStories = [...prev.completedStories, newStory];
        return {
          ...prev,
          story: newStory,
          scores: newScores,
          phase: 'completed',
          completedStories: newCompletedStories
        };
      }

      return {
        ...prev,
        story: newStory,
        scores: newScores,
        phase: 'collecting',
        currentTurn: prev.currentTurn === 1 ? 2 : 1,
        wordSuggestions: new Map(),
        currentWordOptions: [],
        timer: { remaining: 15, phase: 'collecting' }
      };
    });
  };

  const switchTurn = () => {
    setGameState(prev => ({ ...prev, currentTurn: prev.currentTurn === 1 ? 2 : 1 }));
  };

  const joinGame = () => {
    setGameState(prev => {
      const newStreamers = { ...prev.streamers };
      if (!newStreamers[1].connected) {
        newStreamers[1] = { name: 'Streamer 1', connected: true };
      } else if (!newStreamers[2].connected) {
        newStreamers[2] = { name: 'Streamer 2', connected: true };
      }
      return { ...prev, streamers: newStreamers, phase: 'lobby' };
    });
  };

  return (
    <GameContext.Provider value={{
      gameState,
      startWordCollection,
      addWordSuggestion,
      selectWord,
      switchTurn,
      joinGame
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);