import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    listing_id: number;
    content: string;
    timestamp: string;
    is_read: boolean;
    sender_name: string;
    receiver_name: string;
    listing_title: string;
}

interface Conversation {
    userId: number;
    username: string;
    lastMessage: Message;
    unreadCount: number;
    listingId: number | null;
    listingTitle: string | null;
}

const InboxPage: React.FC = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState<{
        conversations: boolean;
        messages: boolean;
        sending: boolean;
    }>({
        conversations: false,
        messages: false,
        sending: false,
    });
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchConversations();
    }, [user]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.userId, selectedConversation.listingId);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        if (!user) return;
        
        try {
            setLoading(prev => ({ ...prev, conversations: true }));
            setError('');
            // Get all messages
            const response = await axios.get('/api/messages');
            const allMessages: Message[] = response.data;

            // Process conversations
            const conversationMap = new Map<string, Conversation>();

            allMessages.forEach(message => {
                const isCurrentUserSender = message.sender_id === user.id;
                const conversationUserId = isCurrentUserSender ? message.receiver_id : message.sender_id;
                const username = isCurrentUserSender ? message.receiver_name : message.sender_name;
                const key = `${conversationUserId}-${message.listing_id || 0}`;

                // Calculate if this is an unread message for current user
                const isUnread = !message.is_read && message.receiver_id === user.id;

                if (!conversationMap.has(key)) {
                    // Create new conversation entry
                    conversationMap.set(key, {
                        userId: conversationUserId,
                        username: username,
                        lastMessage: message,
                        unreadCount: isUnread ? 1 : 0,
                        listingId: message.listing_id,
                        listingTitle: message.listing_title,
                    });
                } else {
                    // Update existing conversation
                    const existing = conversationMap.get(key)!;
                    
                    // Update last message if this one is newer
                    if (new Date(message.timestamp) > new Date(existing.lastMessage.timestamp)) {
                        existing.lastMessage = message;
                    }
                    
                    // Increment unread count if applicable
                    if (isUnread) {
                        existing.unreadCount += 1;
                    }
                    
                    conversationMap.set(key, existing);
                }
            });

            // Convert map to array and sort by most recent message
            const conversationArray = Array.from(conversationMap.values())
                .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());

            setConversations(conversationArray);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            setError('Failed to load conversations');
        } finally {
            setLoading(prev => ({ ...prev, conversations: false }));
        }
    };

    const fetchMessages = async (userId: number, listingId: number | null) => {
        if (!user) return;
        
        try {
            setLoading(prev => ({ ...prev, messages: true }));
            setError('');
            
            // Fetch all messages and filter client-side
            const response = await axios.get('/api/messages');
            const allMessages: Message[] = response.data;
            
            // Filter messages for this conversation
            const conversationMessages = allMessages.filter(message => {
                const isWithSelectedUser = 
                    (message.sender_id === user.id && message.receiver_id === userId) || 
                    (message.receiver_id === user.id && message.sender_id === userId);
                
                // If listingId is provided, also filter by listing
                const isForSelectedListing = listingId ? message.listing_id === listingId : true;
                
                return isWithSelectedUser && isForSelectedListing;
            });
            
            // Sort messages by timestamp (oldest first for chat display)
            const sortedMessages = conversationMessages.sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            
            setMessages(sortedMessages);
            
            // Mark unread messages as read
            const unreadMessages = sortedMessages.filter(
                message => !message.is_read && message.receiver_id === user.id
            );
            
            for (const message of unreadMessages) {
                await handleMarkAsRead(message.id);
            }
            
        } catch (error) {
            console.error('Error fetching messages:', error);
            setError('Failed to load messages');
        } finally {
            setLoading(prev => ({ ...prev, messages: false }));
        }
    };

    const handleSendMessage = async () => {
        if (!selectedConversation || !newMessage.trim() || !user) {
            setError(newMessage.trim() ? 'Please select a conversation' : 'Please enter a message');
            return;
        }

        try {
            setLoading(prev => ({ ...prev, sending: true }));
            setError('');
            
            await axios.post('/api/messages', {
                receiver_id: selectedConversation.userId,
                listing_id: selectedConversation.listingId,
                content: newMessage
            });
            
            setNewMessage('');
            
            // Refresh both conversations and messages
            await fetchMessages(selectedConversation.userId, selectedConversation.listingId);
            await fetchConversations();
            
        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message');
        } finally {
            setLoading(prev => ({ ...prev, sending: false }));
        }
    };

    const handleMarkAsRead = async (messageId: number) => {
        try {
            await axios.put(`/api/messages/${messageId}/read`);
            // No need to refresh here - we'll do that after all unread messages are processed
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    const selectConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-3xl font-bold mb-6">Messages</h1>
            
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex h-[calc(100vh-200px)] min-h-[500px]">
                    {/* Conversations Sidebar */}
                    <div className="w-1/3 border-r overflow-y-auto">
                        <div className="p-4 border-b">
                            <h2 className="font-bold text-lg">Conversations</h2>
                        </div>
                        
                        {loading.conversations ? (
                            <div className="flex justify-center items-center h-32">
                                <span className="text-gray-500">Loading conversations...</span>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <p>No messages yet.</p>
                                <p className="mt-2">
                                    <Link to="/" className="text-blue-500 hover:underline">
                                        Browse listings
                                    </Link> to start a conversation.
                                </p>
                            </div>
                        ) : (
                            <ul>
                                {conversations.map((conversation) => (
                                    <li 
                                        key={`${conversation.userId}-${conversation.listingId || 0}`}
                                        className={`border-b cursor-pointer hover:bg-gray-50 ${
                                            selectedConversation?.userId === conversation.userId &&
                                            selectedConversation?.listingId === conversation.listingId
                                                ? 'bg-blue-50'
                                                : ''
                                        }`}
                                        onClick={() => selectConversation(conversation)}
                                    >
                                        <div className="p-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold">{conversation.username}</h3>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(conversation.lastMessage.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                            
                                            {conversation.listingTitle && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Re: {conversation.listingTitle}
                                                </p>
                                            )}
                                            
                                            <p className="text-sm text-gray-700 mt-1 truncate">
                                                {conversation.lastMessage.content}
                                            </p>
                                            
                                            {conversation.unreadCount > 0 && (
                                                <span className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded-full mt-2">
                                                    {conversation.unreadCount} new
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Message Content */}
                    <div className="w-2/3 flex flex-col">
                        {selectedConversation ? (
                            <>
                                {/* Conversation Header */}
                                <div className="p-4 border-b flex justify-between items-center">
                                    <div>
                                        <h2 className="font-bold text-lg">{selectedConversation.username}</h2>
                                        {selectedConversation.listingTitle && (
                                            <p className="text-sm text-gray-600">
                                                Re: {selectedConversation.listingTitle}
                                            </p>
                                        )}
                                    </div>
                                    {selectedConversation.listingId && (
                                        <Link 
                                            to={`/listings/${selectedConversation.listingId}`}
                                            className="text-blue-500 hover:underline text-sm"
                                        >
                                            View Listing
                                        </Link>
                                    )}
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {loading.messages ? (
                                        <div className="flex justify-center items-center h-32">
                                            <span className="text-gray-500">Loading messages...</span>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center text-gray-500 mt-4">
                                            <p>No messages in this conversation yet.</p>
                                            <p>Send a message to start the conversation.</p>
                                        </div>
                                    ) : (
                                        messages.map((message) => (
                                            <div 
                                                key={message.id} 
                                                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div 
                                                    className={`max-w-[70%] rounded-lg p-3 ${
                                                        message.sender_id === user?.id 
                                                            ? 'bg-blue-500 text-white' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    <p>{message.content}</p>
                                                    <p className={`text-xs mt-1 text-right ${
                                                        message.sender_id === user?.id 
                                                            ? 'text-blue-100' 
                                                            : 'text-gray-500'
                                                    }`}>
                                                        {new Date(message.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t">
                                    <div className="flex space-x-2">
                                        <textarea
                                            className="flex-1 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Type a message..."
                                            rows={3}
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={loading.sending || !newMessage.trim()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                                        >
                                            {loading.sending ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <p className="mb-2">Select a conversation to start messaging</p>
                                    {conversations.length === 0 && (
                                        <Link to="/" className="text-blue-500 hover:underline">
                                            Browse listings to start a new conversation
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InboxPage; 