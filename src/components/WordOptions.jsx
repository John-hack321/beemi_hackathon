const WordOptions = ({ words, onSelect, timeRemaining, canSelect }) => {
  return (
    <div className="word-options-container">
      <div className="timer">
        <span className={timeRemaining <= 2 ? 'urgent' : ''}>
          {timeRemaining}s
        </span>
      </div>
      
      <div className="word-buttons">
        {words.map((word, index) => (
          <button
            key={index}
            className="word-btn"
            onClick={() => onSelect(word)}
            disabled={!canSelect}
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  )
}

export default WordOptions;