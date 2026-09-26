/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginCredentials, SignupData, UserRole } from '../types/user';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  signup: (data: SignupData) => Promise<{ user: any; session: any; confirmationRequired: boolean }>;
  verifyOtp: (email: string, token: string, role: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  verifyPassword: (password: string) => Promise<boolean>;
  requestEmailChange: (newEmail: string) => Promise<void>;
  requestPhoneChange: (newPhone: string) => Promise<void>;
  verifyEmailChange: (newEmail: string, token: string) => Promise<User>;
  verifyPhoneChange: (newPhone: string, token: string) => Promise<User>;
  requestPasswordReset: (destination: { email?: string; phone?: string }) => Promise<void>;
  verifyPasswordResetOtp: (destination: { email?: string; phone?: string }, token: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  isAuthenticated: boolean;
  isCitizen: boolean;
  isOfficer: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      return authService.getFallbackSession();
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.login(credentials);
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData) => {
    setIsLoading(true);
    try {
      const result = await authService.signup(data);
      // Only set active user context if registration succeeded and email confirmation is NOT required
      if (!result.confirmationRequired && result.user) {
        setUser(result.user);
      }
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, token: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.verifyOtp(email, token, role);
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('Not authenticated');
    const updated = await authService.updateProfile(user.id, updates);
    setUser(updated);
    return updated;
  };

  const verifyPassword = async (password: string) => {
    if (!user) throw new Error('Not authenticated');
    return await authService.verifyPassword(user.email, password);
  };

  const requestEmailChange = async (newEmail: string) => {
    await authService.requestEmailChange(newEmail);
  };

  const requestPhoneChange = async (newPhone: string) => {
    await authService.requestPhoneChange(newPhone);
  };

  const verifyEmailChange = async (newEmail: string, token: string) => {
    if (!user) throw new Error('Not authenticated');
    const updated = await authService.verifyEmailChange(newEmail, token, user.id);
    setUser(updated);
    return updated;
  };

  const verifyPhoneChange = async (newPhone: string, token: string) => {
    if (!user) throw new Error('Not authenticated');
    const updated = await authService.verifyPhoneChange(newPhone, token, user.id);
    setUser(updated);
    return updated;
  };

  const requestPasswordReset = async (destination: { email?: string; phone?: string }) => {
    await authService.requestPasswordReset(destination);
  };

  const verifyPasswordResetOtp = async (destination: { email?: string; phone?: string }, token: string) => {
    await authService.verifyPasswordResetOtp(destination, token);
  };

  const resetPassword = async (password: string) => {
    await authService.resetPassword(password);
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    verifyOtp,
    logout,
    updateProfile,
    verifyPassword,
    requestEmailChange,
    requestPhoneChange,
    verifyEmailChange,
    verifyPhoneChange,
    requestPasswordReset,
    verifyPasswordResetOtp,
    resetPassword,
    isAuthenticated: !!user,
    isCitizen: user?.role === 'citizen',
    isOfficer: user?.role === 'officer',
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
