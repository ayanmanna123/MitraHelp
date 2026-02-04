import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { FaPaperPlane } from 'react-icons/fa';

const ChatBox = ({ emergencyId, currentUser }) => {
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (socket && emergencyId) {
            // Join the emergency room
            socket.emit('join_emergency', emergencyId);
            console.log('ChatBox: Joined emergency room', emergencyId);

            // Listen for incoming messages
            const handleMessage = (data) => {
                console.log('ChatBox: Received message', data);
                setMessages((prev) => [...prev, data]);
            };

            socket.on('receive_message', handleMessage);

            // Handle connection status
            socket.on('connect', () => {
                console.log('ChatBox: Connected to socket');
                setIsConnected(true);
                socket.emit('join_emergency', emergencyId);
            });

            socket.on('disconnect', () => {
                console.log('ChatBox: Disconnected from socket');
                setIsConnected(false);
            });

            // Cleanup
            return () => {
                socket.off('receive_message', handleMessage);
                socket.off('connect');
                socket.off('disconnect');
                console.log('ChatBox: Left emergency room', emergencyId);
            };
        }
    }, [socket, emergencyId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messageData = {
            emergencyId,
            senderId: currentUser._id,
            senderName: currentUser.name,
            text: newMessage,
            timestamp: new Date().toISOString()
        };

        // Optimistically add own message? 
        // Actually, since we emit to room including sender, let's just wait for round trip 
        // OR emit returns to us too. backend io.to(room).emit sends to everyone including sender?
        // Usually io.to(room) includes sender. Let's assume backend implementation does that.
        // My implementation: io.to(data.emergencyId).emit(...) -> sends to everyone in room including sender.

        socket.emit('send_message', messageData);
        setNewMessage('');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[400px]">
            <div className="p-4 border-b bg-gray-50 rounded-t-xl flex justify-between items-center">
                <h3 className="font-bold text-gray-700">Live Chat</h3>
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-xs text-gray-500">
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm mt-10">
                        Start communicating...
                    </div>
                )}
                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser._id;
                    return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                }`}>
                                {!isMe && <p className="text-xs font-bold text-gray-500 mb-1">{msg.senderName}</p>}
                                <p className="text-sm">{msg.text}</p>
                                <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    disabled={!newMessage.trim()}
                >
                    <FaPaperPlane />
                </button>
            </form>
        </div>
    );
};

export default ChatBox;
