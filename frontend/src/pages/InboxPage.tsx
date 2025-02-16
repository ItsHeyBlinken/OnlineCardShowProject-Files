import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

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
}

const InboxPage: React.FC = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');

    // Fetch conversations (grouped messages)
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await axios.get('/api/messages/conversations');
                setConversations(response.data);
            } catch (error) {
                console.error('Error fetching conversations:', error);
                setError('Failed to load conversations');
            }
        };

        fetchConversations();
    }, []);

    // Fetch messages for selected conversation
    useEffect(() => {
        const fetchMessages = async () => {
            if (selectedConversation) {
                try {
                    const response = await axios.get(`/api/messages/conversation/${selectedConversation}`);
                    setMessages(response.data);
                } catch (error) {
                    console.error('Error fetching messages:', error);
                    setError('Failed to load messages');
                }
            }
        };

        fetchMessages();
    }, [selectedConversation]);

    const handleSendMessage = async () => {
        if (!selectedConversation || !newMessage.trim()) return;

        try {
            await axios.post('/api/messages', {
                receiver_id: selectedConversation,
                content: newMessage
            });
            setNewMessage('');
            // Refresh messages
            const response = await axios.get(`/api/messages/conversation/${selectedConversation}`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow">
                    <div className="grid grid-cols-3 h-[calc(100vh-200px)]">
                        {/* Conversations List */}
                        <div className="col-span-1 border-r border-gray-200 overflow-y-auto">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold">Messages</h2>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {conversations.map((conversation) => (
                                    <div
                                        key={conversation.userId}
                                        onClick={() => setSelectedConversation(conversation.userId)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                                            selectedConversation === conversation.userId ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-medium">{conversation.username}</h3>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {conversation.lastMessage.content}
                                                </p>
                                            </div>
                                            {conversation.unreadCount > 0 && (
                                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                                                    {conversation.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="col-span-2 flex flex-col">
                            {selectedConversation ? (
                                <>
                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${
                                                    message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                                                }`}
                                            >
                                                <div
                                                    className={`max-w-sm rounded-lg px-4 py-2 ${
                                                        message.sender_id === user?.id
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-100'
                                                    }`}
                                                >
                                                    <p>{message.content}</p>
                                                    <p className="text-xs mt-1 opacity-75">
                                                        {new Date(message.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-4 border-t border-gray-200">
                                        <div className="flex space-x-4">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Type your message..."
                                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSendMessage();
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={handleSendMessage}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500">
                                    Select a conversation to start messaging
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InboxPage; 