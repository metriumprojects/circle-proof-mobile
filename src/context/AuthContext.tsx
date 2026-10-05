import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getStoredToken, getStoredUserData, clearAuthData, isAuthenticated as checkIsAuthenticated, storeAuthData } from '../util/authController';

interface AuthContextType {
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, userData: any) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const login = async (token: string, userData: any) => {
    setToken(token);
    setUser(userData);
    setIsAuthenticated(true);
    // Store auth data in AsyncStorage
    await storeAuthData(token, userData);
  };

  const logout = async () => {
    await clearAuthData();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const storedToken = await getStoredToken();
      const userData = await getStoredUserData();
      const authStatus = await checkIsAuthenticated();

      if (authStatus && storedToken && userData) {
        setToken(storedToken);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
