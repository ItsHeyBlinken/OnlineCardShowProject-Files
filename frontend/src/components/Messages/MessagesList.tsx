import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MessagesList: React.FC<{ userId: string; listingId: string }> = ({ userId, listingId }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await axios.get(`/api/messages/${userId}?listingId=${listingId}`);
      setMessages(response.data);
    };

    fetchMessages();
  }, [userId, listingId]);

  return (
    <div className="messages-list">
      {messages.map((message) => (
        <div key={message.id} className="message">
          <p><strong>{message.senderId}</strong>: {message.content}</p>
          <span>{new Date(message.timestamp).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default MessagesList; 