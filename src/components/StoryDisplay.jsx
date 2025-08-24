const StoryDisplay = ({ story }) => {
  return (
    <div className="story-container">
      <h2>Story in Progress</h2>
      <div className="story-text">
        {story.map((word, index) => (
          <span 
            key={index}
            className={`story-word streamer-${word.streamer}`}
          >
            {word.text}{index < story.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
      <div className="story-stats">
        Words: {story.length} / 15
      </div>
    </div>
  )
}

export default StoryDisplay;