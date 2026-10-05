import React, { createContext, useContext, ReactNode } from 'react';

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = React.useState(0);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
