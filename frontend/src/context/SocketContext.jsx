import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            const newSocket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
                transports: ['polling', 'websocket'],
            });

            newSocket.on('connect', () => {
                console.log('Socket Connected');
                newSocket.emit('join', user._id);
            });

            newSocket.on('new_emergency', (data) => {
                if (user.role === 'volunteer') {
                    toast.error(`🚨 New Emergency: ${data.type} request nearby!`, { duration: 5000 });
                }
            });

            newSocket.on('status_update', (data) => {
                toast.success(`Update: Emergency is ${data.status}`);
            });

            setSocket(newSocket);

            return () => newSocket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
