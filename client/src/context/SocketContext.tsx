import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const url = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    const sock = io(url, { withCredentials: true });

    if (sock) {
      setSocket(sock);
      
      sock.on('connect', () => {
        console.log('Socket connected');
      });

      sock.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      return () => {
        sock.disconnect();
      };
    }

    return undefined;
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
