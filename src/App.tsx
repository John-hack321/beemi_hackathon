import { useState, useEffect } from 'react';
import './App.css';
import BeemiProvider from './components/BeemiProvider';
import StoryDisplay from './components/StoryDisplay';
import WordOptions from './components/WordOptions';
import Scoreboard from './components/Scoreboard';
import StatusBar from './components/StatusBar';
import ChatView from './components/ChatView';

function App() {
  const [story, setStory] = useState([]);
  const [turn, setTurn] = useState(1);
  const [gamePhase, setGamePhase] = useState('waiting'); // waiting, collecting, choosing, completed
  const [streamer1Score, setStreamer1Score] = useState(0);
  const [streamer2Score, setStreamer2Score] = useState(0);
  const [wordOptions, setWordOptions] = useState([]);
  const [wordSuggestions, setWordSuggestions] = useState(new Map());
  const [chatMessages, setChatMessages] = useState([]);
  const [votes, setVotes] = useState({ streamer1: 0, streamer2: 0 });
  const [streamer1Connected, setStreamer1Connected] = useState(false);
  const [streamer2Connected, setStreamer2Connected] = useState(false);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (!streamer1Connected || !streamer2Connected) {
        setGamePhase('paused');
        return;
      }

      if (gamePhase === 'collecting') {
        setGamePhase('choosing');
        // Select top 4 words
        const sortedWords = [...wordSuggestions.entries()].sort((a, b) => b[1] - a[1]);
        let topWords = sortedWords.slice(0, 4).map(item => item[0]);

        // Seed words if chat is quiet
        if (topWords.length < 4) {
          const seedWords = ['and', 'the', 'a', 'is'];
          topWords = [...topWords, ...seedWords.slice(0, 4 - topWords.length)];
        }

        setWordOptions(topWords);
      } else if (gamePhase === 'choosing') {
        // If no selection, choose random word
        const randomWord = wordOptions[Math.floor(Math.random() * wordOptions.length)];
        handleWordSelection(randomWord);
      }
    }, 5000); // 5 second turn cycle

    return () => clearInterval(gameLoop);
  }, [gamePhase, wordOptions, wordSuggestions, streamer1Connected, streamer2Connected]);

  const handleWordSelection = (word) => {
    setStory([...story, word]);
    // Award points
    const timeBonus = 5000 - (Date.now() - turnStartTime) > 2500 ? 2 : 0;
    if (turn === 1) {
      setStreamer1Score(streamer1Score + 10 + votes.streamer1 + timeBonus);
    } else {
      setStreamer2Score(streamer2Score + 10 + votes.streamer2 + timeBonus);
    }
    // Reset votes and suggestions
    setVotes({ streamer1: 0, streamer2: 0 });
    setWordSuggestions(new Map());
    // Switch turns
    setTurn(turn === 1 ? 2 : 1);
    setGamePhase('collecting');
    setTurnStartTime(Date.now());
  };

  const handleChatMessage = (event) => {
    const message = extractMessage(event);
    if (!message) return;

    setChatMessages(prev => [...prev, message]);

    if (isVoteMessage(message.text)) {
      processVote(message.text);
    } else if (gamePhase === 'collecting' && isSingleWord(message.text)) {
      const word = message.text.toLowerCase();
      setWordSuggestions(prev => new Map(prev).set(word, (prev.get(word) || 0) + 1));
    }
  };

  const extractMessage = (event) => {
    if (event.text && event.user) return { text: event.text, user: event.user };
    if (event.content && event.username) return { text: event.content, user: event.username };
    if (event.message && event.user) return { text: event.message, user: event.user };
    if (event.text && event.from) return { text: event.text, user: event.from };
    return null;
  };

  const isVoteMessage = (text) => {
    return text === '1' || text === '2';
  };

  const processVote = (text) => {
    if (text === '1') {
      setVotes(prev => ({ ...prev, streamer1: prev.streamer1 + 1 }));
    } else if (text === '2') {
      setVotes(prev => ({ ...prev, streamer2: prev.streamer2 + 1 }));
    }
  };

  const isSingleWord = (text) => {
    return !text.includes(' ') && /^[a-zA-Z]+$/.test(text);
  };

  const [turnStartTime, setTurnStartTime] = useState(0);

  useEffect(() => {
    // @ts-ignore
    window.beemi.streams.onChat(handleChatMessage);
    // @ts-ignore
    window.beemi.multiplayer.on('room-event', handleChatMessage);
    // @ts-ignore
    window.beemi.multiplayer.on('player-joined', (player) => {
      if (!streamer1Connected) {
        setStreamer1Connected(true);
      } else if (!streamer2Connected) {
        setStreamer2Connected(true);
      }
    });
    // @ts-ignore
    window.beemi.multiplayer.on('player-left', (player) => {
      // This is a simplification. In a real app, you'd need to identify which streamer left.
      setStreamer2Connected(false);
    });

    // Start the game
    setGamePhase('collecting');
    setTurnStartTime(Date.now());
  }, []);

  return (
    <BeemiProvider>
      <div className="app">
        <div className="game-layout">
          <div className="left-panel">
            <div className="video-feed">Live Video Feed</div>
            <Scoreboard streamer1Score={streamer1Score} streamer2Score={streamer2Score} />
          </div>
          <div className="main-panel">
            <StoryDisplay story={story} />
            <WordOptions wordOptions={wordOptions} onSelect={handleWordSelection} />
            <StatusBar gamePhase={gamePhase} turn={turn} />
          </div>
          <div className="right-panel">
            <ChatView chatMessages={chatMessages} />
          </div>
        </div>
      </div>
    </BeemiProvider>
  );
}

export default App;