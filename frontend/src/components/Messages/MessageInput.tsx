import React, { useState } from 'react';
import axios from 'axios';

const MessageInput: React.FC<{ senderId: string; receiverId: string; listingId: string }> = ({ senderId, receiverId, listingId }) => {
  const [content, setContent] = useState('');

  const handleSendMessage = async () => {
    if (!content) return;

    await axios.post('/api/messages', {
      senderId,
      receiverId,
      listingId,
      content,
    });

    setContent(''); // Clear input after sending
  };

  return (
    <div className="message-input">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
};

export default MessageInput; 