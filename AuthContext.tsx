
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from './types';
import { db } from './db';

interface AuthContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (user: User, remember: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const savedUser = localStorage.getItem('fm_current_user') || sessionStorage.getItem('fm_current_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setCurrentUser(parsed);
          setIsLoggedIn(true);
        } catch (e) {
          console.error("Erro ao restaurar sessão:", e);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback((user: User, remember: boolean) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('fm_is_logged', 'true');
    storage.setItem('fm_current_user', JSON.stringify(user));
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('fm_is_logged');
    localStorage.removeItem('fm_current_user');
    sessionStorage.removeItem('fm_is_logged');
    sessionStorage.removeItem('fm_current_user');
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
