import React from 'react';

const StoryDisplay = ({ story }) => {
  return (
    <div className="story-display">
      {story.map((word, index) => (
        <p key={index}>{word}</p>
      ))}
    </div>
  );
};

export default StoryDisplay;
