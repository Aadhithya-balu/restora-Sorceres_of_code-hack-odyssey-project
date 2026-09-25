import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRegisterData } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isRestoringSession: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: UserRegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalMode: 'login' | 'register';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('restora_token'));
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(() => !!localStorage.getItem('restora_token'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const refreshUser = async () => {
    try {
      const u = await authApi.getMe();
      setUser(u);
    } catch {
      localStorage.removeItem('restora_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsRestoringSession(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('restora_token');
    if (savedToken) {
      refreshUser();
    } else {
      // True guest experience: starts unauthenticated without auto-login
      setIsRestoringSession(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('restora_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  const register = async (data: UserRegisterData) => {
    const res = await authApi.register(data);
    localStorage.setItem('restora_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('restora_token');
    setToken(null);
    setUser(null);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isRestoringSession,
        login,
        register,
        logout,
        refreshUser,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
