import React, { createContext, useContext, useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  // Return null instead of throwing error to prevent crashes
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [pusher, setPusher] = useState(null);
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.organization) {
      // Initialize Pusher
      const pusherInstance = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
        cluster: import.meta.env.VITE_PUSHER_CLUSTER,
      });

      pusherInstance.connection.bind('connected', () => {
        console.log('Pusher connected');
      });

      pusherInstance.connection.bind('disconnected', () => {
        console.log('Pusher disconnected');
      });

      pusherInstance.connection.bind('error', (error) => {
        console.error('Pusher connection error:', error);
      });

      // Subscribe to organization channel
      const orgChannel = pusherInstance.subscribe(`org-${user.organization}`);

      setPusher(pusherInstance);
      setChannel(orgChannel);

      return () => {
        if (orgChannel) {
          pusherInstance.unsubscribe(`org-${user.organization}`);
        }
        pusherInstance.disconnect();
      };
    } else {
      if (pusher) {
        pusher.disconnect();
        setPusher(null);
        setChannel(null);
      }
    }
  }, [isAuthenticated, user?.organization]);

  return (
    <SocketContext.Provider value={{ pusher, channel }}>
      {children}
    </SocketContext.Provider>
  );
};

