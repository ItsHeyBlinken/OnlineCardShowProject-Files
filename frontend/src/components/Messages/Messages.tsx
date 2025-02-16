import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

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

export const Messages: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await axios.get('/api/messages');
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setError('Failed to load messages');
        }
    };

    const handleSendMessage = async (receiverId: number, listingId?: number) => {
        try {
            await axios.post('/api/messages', {
                receiver_id: receiverId,
                listing_id: listingId,
                content: newMessage
            });
            setNewMessage('');
            fetchMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message');
        }
    };

    const handleMarkAsRead = async (messageId: number) => {
        try {
            await axios.put(`/api/messages/${messageId}/read`);
            fetchMessages();
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Messages</h2>
            <div className="space-y-4">
                {messages.map((message) => (
                    <div 
                        key={message.id} 
                        className={`p-4 rounded-lg ${
                            message.is_read ? 'bg-gray-50' : 'bg-blue-50'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">
                                    {message.sender_id === user?.id ? 'To: ' + message.receiver_name : 'From: ' + message.sender_name}
                                </p>
                                {message.listing_title && (
                                    <p className="text-sm text-gray-600">Re: {message.listing_title}</p>
                                )}
                            </div>
                            <span className="text-sm text-gray-500">
                                {new Date(message.timestamp).toLocaleString()}
                            </span>
                        </div>
                        <p className="mt-2">{message.content}</p>
                        {!message.is_read && message.receiver_id === user?.id && (
                            <button
                                onClick={() => handleMarkAsRead(message.id)}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                                Mark as read
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}; 