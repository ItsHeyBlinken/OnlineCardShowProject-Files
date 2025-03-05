import React from 'react';
// Assuming the correct paths for MessagesList and MessageInput are as follows:
import MessagesList from '../../components/Messages/MessagesList';
import MessageInput from '../../components/Messages/MessageInput';

const ItemDetailPage: React.FC<{ listingId: string; sellerId: string; userId: string }> = ({ listingId, sellerId, userId }) => {
  return (
    <div>
      {/* Item details here */}
      <h1>Item Title</h1>
      <p>Item Description</p>

      {/* Messaging Section */}
      <MessagesList userId={userId} listingId={listingId} />
      <MessageInput senderId={userId} receiverId={sellerId} listingId={listingId} />
    </div>
  );
};

export default ItemDetailPage; 