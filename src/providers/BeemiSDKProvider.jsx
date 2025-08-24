import React, { createContext, useState, useEffect, useContext } from 'react';
import { useGame } from './GameProvider';

export const BeemiContext = createContext();

export const BeemiSDKProvider = ({ children }) => {
  const [beemi, setBeemi] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { addWordSuggestion, gameState } = useGame();

  useEffect(() => {
    const checkForBeemi = () => {
      if (window.beemi) {
        setBeemi(window.beemi);
        setIsConnected(true);
        setupEventListeners();
      } else {
        setTimeout(checkForBeemi, 100);
      }
    };
    checkForBeemi();
  }, []);

  const setupEventListeners = () => {
    window.beemi.streams.onChat(handleChatMessage);
    window.beemi.multiplayer.on('room-event', handleRoomEvent);
    window.beemi.multiplayer.on('player-joined', handlePlayerJoined);
    window.beemi.multiplayer.on('player-left', handlePlayerLeft);
  };

  const handleChatMessage = (event) => {
    const message = extractMessage(event);
    if (!message) return;

    if (isVoteMessage(message.text)) {
      // processVote(message.text, message.user);
      return;
    }

    if (isSingleWord(message.text) && gameState.phase === 'collecting') {
      addWordSuggestion(message.text.toLowerCase());
    }
  };

  const handleRoomEvent = (event) => {
    // Handle custom room events
  };

  const handlePlayerJoined = (player) => {
    // Handle player joined
  };

  const handlePlayerLeft = (player) => {
    // Handle player left
  };

  const extractMessage = (event) => {
    if (event.text && event.user) return { text: event.text, user: event.user };
    if (event.content && event.username) return { text: event.content, user: event.username };
    if (event.message && event.user) return { text: event.message, user: event.user };
    if (event.text && event.from) return { text: event.text, user: event.from };
    return null;
  };

  const isSingleWord = (text) => {
    return !text.includes(' ') && /^[a-zA-Z]+$/.test(text) && text.length > 1;
  };

  const isVoteMessage = (text) => {
    return text.trim() === '1' || text.trim() === '2';
  };

  return (
    <BeemiContext.Provider value={{ beemi, isConnected }}>
      {children}
    </BeemiContext.Provider>
  );
};