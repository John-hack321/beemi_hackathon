import React from 'react';

import { useState, useEffect } from 'react';

const WordOptions = ({ wordOptions, onSelect }) => {
  const [selectedWord, setSelectedWord] = useState(null);

  useEffect(() => {
    setSelectedWord(null);
  }, [wordOptions]);

  const handleSelect = (word) => {
    setSelectedWord(word);
    onSelect(word);
  };

  return (
    <div className="word-options">
      {wordOptions.map((word, index) => (
        <button
          key={index}
          className={selectedWord === word ? 'selected' : ''}
          onClick={() => handleSelect(word)}
        >
          {word}
        </button>
      ))}
    </div>
  );
};

export default WordOptions;
