import React from 'react';

const ChatView = ({ chatMessages }) => {
  return (
    <div className="chat-view">
      <h2>Live Chat</h2>
      <ul>
        {chatMessages.map((msg, index) => (
          <li key={index}><strong>{msg.user}:</strong> {msg.text}</li>
        ))}
      </ul>
    </div>
  );
};

export default ChatView;
