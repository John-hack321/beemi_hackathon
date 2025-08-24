import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from './GameProvider';

export const BeemiContext = createContext();

export const BeemiSDKProvider = ({ children }) => {
  const [beemi, setBeemi] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const { 
    addWordSuggestion, 
    gameState, 
    selectWord, 
    startWordCollection,
    joinGame: joinGameContext
  } = useGame();
  
  // Store the latest game state in a ref to avoid dependency issues
  const gameStateRef = useRef(gameState);
  
  // Keep the ref updated with the latest game state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Check for Beemi SDK and set up connection
  useEffect(() => {
    const checkForBeemi = () => {
      if (window.beemi) {
        const beemiInstance = window.beemi;
        setBeemi(beemiInstance);
        setIsConnected(true);
        setupEventListeners(beemiInstance);
        
        // Auto-join game if room code exists
        const roomCode = getCookie('roomCode');
        if (roomCode) {
          joinRoom(roomCode);
        }
      } else {
        setTimeout(checkForBeemi, 100);
      }
    };
    
    checkForBeemi();
    
    // Cleanup function
    return () => {
      if (window.beemi) {
        removeEventListeners(window.beemi);
      }
    };
  }, []);

  // Set up Beemi event listeners
  const setupEventListeners = useCallback((beemiInstance) => {
    if (!beemiInstance) return;
    
    // Chat events
    beemiInstance.streams.onChat(handleChatMessage);
    
    // Multiplayer events
    beemiInstance.multiplayer.on('room-event', handleRoomEvent);
    beemiInstance.multiplayer.on('player-joined', handlePlayerJoined);
    beemiInstance.multiplayer.on('player-left', handlePlayerLeft);
    beemiInstance.multiplayer.on('room-joined', handleRoomJoined);
    beemiInstance.multiplayer.on('room-left', handleRoomLeft);
    
    console.log('Beemi event listeners set up');
  }, []);
  
  // Remove Beemi event listeners
  const removeEventListeners = useCallback((beemiInstance) => {
    if (!beemiInstance) return;
    
    // Remove chat events
    beemiInstance.streams.offChat(handleChatMessage);
    
    // Remove multiplayer events
    beemiInstance.multiplayer.off('room-event', handleRoomEvent);
    beemiInstance.multiplayer.off('player-joined', handlePlayerJoined);
    beemiInstance.multiplayer.off('player-left', handlePlayerLeft);
    beemiInstance.multiplayer.off('room-joined', handleRoomJoined);
    beemiInstance.multiplayer.off('room-left', handleRoomLeft);
    
    console.log('Beemi event listeners removed');
  }, []);

  // Handle incoming chat messages
  const handleChatMessage = useCallback((event) => {
    const message = extractMessage(event);
    if (!message) return;
    
    // Add to chat history
    setChatMessages(prev => {
      const newMessages = [...prev, { ...message, timestamp: new Date().toISOString() }];
      // Keep only the last 100 messages
      return newMessages.slice(-100);
    });
    
    // Process game-related commands
    const currentState = gameStateRef.current;
    const text = message.text.trim().toLowerCase();
    
    // Handle game commands
    if (text.startsWith('!join')) {
      const playerName = text.split(' ').slice(1).join(' ').trim() || message.user;
      joinGameContext(playerName);
      return;
    }
    
    if (text === '!start' && currentState.phase === 'lobby') {
      startWordCollection();
      return;
    }
    
    // Handle word suggestions during collection phase
    if (currentState.phase === 'collecting' && isSingleWord(text)) {
      addWordSuggestion(text);
      return;
    }
    
    // Handle word selection during selection phase
    if (currentState.phase === 'selecting' && isVoteMessage(text)) {
      const wordIndex = parseInt(text) - 1;
      const words = currentState.currentWordOptions;
      if (wordIndex >= 0 && wordIndex < words.length) {
        selectWord(words[wordIndex]);
      }
      return;
    }
  }, [addWordSuggestion, selectWord, startWordCollection, joinGameContext]);

  // Handle room events
  const handleRoomEvent = useCallback((event) => {
    console.log('Room event:', event);
    // Handle custom room events here
    // You can add game-specific room events like:
    // - Game state synchronization
    // - Player actions
    // - Score updates
  }, []);

  // Handle player joined event
  const handlePlayerJoined = useCallback((player) => {
    console.log('Player joined:', player);
    // Update game state when a player joins
    joinGameContext(player.name || player.id);
  }, [joinGameContext]);

  // Handle player left event
  const handlePlayerLeft = useCallback((player) => {
    console.log('Player left:', player);
    // Handle player disconnection
    // You might want to pause the game or handle disconnection gracefully
  }, []);
  
  // Handle room joined event
  const handleRoomJoined = useCallback((room) => {
    console.log('Joined room:', room);
    // Update room code in state and cookie
    document.cookie = `roomCode=${room.id};path=/;max-age=86400`; // 24h expiry
  }, []);
  
  // Handle room left event
  const handleRoomLeft = useCallback(() => {
    console.log('Left room');
    // Clear room code from cookie
    document.cookie = 'roomCode=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }, []);

  // Create a new room
  const createRoom = useCallback(async () => {
    if (!beemi) return null;
    
    try {
      const room = await beemi.multiplayer.createRoom({
        name: 'Word Game',
        maxPlayers: 2,
        isPrivate: true
      });
      
      console.log('Room created:', room);
      return room.id;
    } catch (error) {
      console.error('Failed to create room:', error);
      return null;
    }
  }, [beemi]);
  
  // Join an existing room
  const joinRoom = useCallback(async (roomCode) => {
    if (!beemi || !roomCode) return false;
    
    try {
      await beemi.multiplayer.joinRoom(roomCode);
      console.log(`Joined room: ${roomCode}`);
      return true;
    } catch (error) {
      console.error('Failed to join room:', error);
      return false;
    }
  }, [beemi]);
  
  // Send a chat message
  const sendChatMessage = useCallback((message) => {
    if (!beemi || !message) return false;
    
    try {
      beemi.streams.sendChat(message);
      return true;
    } catch (error) {
      console.error('Failed to send chat message:', error);
      return false;
    }
  }, [beemi]);

  // Helper function to extract message from different event formats
  const extractMessage = (event) => {
    if (!event) return null;
    
    // Handle different event formats from different platforms
    if (event.text && event.user) return { text: event.text, user: event.user };
    if (event.content && event.username) return { text: event.content, user: event.username };
    if (event.message && event.user) return { text: event.message, user: event.user };
    if (event.text && event.from) return { text: event.text, user: event.from };
    if (typeof event === 'string') return { text: event, user: 'System' };
    
    console.warn('Unhandled message format:', event);
    return null;
  };

  // Check if a message is a single word
  const isSingleWord = (text) => {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    return !trimmed.includes(' ') && /^[a-zA-Z]{2,20}$/.test(trimmed);
  };

  // Check if a message is a vote (1-4)
  const isVoteMessage = (text) => {
    if (!text) return false;
    const trimmed = text.trim();
    return /^[1-4]$/.test(trimmed);
  };
  
  // Get cookie helper function
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // Context value
  const contextValue = {
    beemi,
    isConnected,
    chatMessages,
    createRoom,
    joinRoom,
    sendChatMessage,
    currentRoom: beemi?.multiplayer?.currentRoom || null
  };

  return (
    <BeemiContext.Provider value={contextValue}>
      {children}
    </BeemiContext.Provider>
  );
};