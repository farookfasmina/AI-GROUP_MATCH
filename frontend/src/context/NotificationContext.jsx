import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!currentUser) return;
    try {
      const response = await api.get('/notifications');
      // Count notifications where is_read strictly equals false
      const count = response.data.filter(n => n.is_read === false).length;
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch notification status", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all/');
      setUnreadCount(0); // Instantly optimistically update the UI to zero
    } catch (err) {
      console.error("Failed to mark notifications read", err);
      // Fallback: reload the true count if the request failed
      fetchUnreadCount();
    }
  };

  useEffect(() => {
    if (currentUser) {
      // Fire immediately upon authentication presence
      fetchUnreadCount();
      
      // Establish background polling interval every 60 seconds (60000ms)
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 60000);
      
      return () => clearInterval(interval);
    } else {
      // Clear data if user logs out
      setUnreadCount(0);
    }
  }, [currentUser]);

  return (
    <NotificationContext.Provider value={{ unreadCount, fetchUnreadCount, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
