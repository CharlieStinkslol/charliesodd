import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  isAdmin: boolean;
  createdAt: Date;
  stats: {
    totalBets: number;
    totalWins: number;
    totalLosses: number;
    biggestWin: number;
    biggestLoss: number;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => boolean;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateBalance: (amount: number) => void;
  updateStats: (betAmount: number, winAmount: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize default users and load saved state
  useEffect(() => {
    // Create default users if they don't exist
    const existingUsers = localStorage.getItem('charlies-odds-users');
    if (!existingUsers) {
      const defaultUsers = [
        {
          id: 'admin-001',
          username: 'admin',
          email: 'admin@charliesodds.com',
          password: 'admin',
          balance: 10000,
          isAdmin: true,
          createdAt: new Date().toISOString(),
          stats: { totalBets: 0, totalWins: 0, totalLosses: 0, biggestWin: 0, biggestLoss: 0 }
        },
        {
          id: 'demo-001',
          username: 'demo',
          email: 'demo@charliesodds.com',
          password: 'demo',
          balance: 1000,
          isAdmin: false,
          createdAt: new Date().toISOString(),
          stats: { totalBets: 0, totalWins: 0, totalLosses: 0, biggestWin: 0, biggestLoss: 0 }
        }
      ];
      localStorage.setItem('charlies-odds-users', JSON.stringify(defaultUsers));
    }

    // Load current user session
    const currentUserId = localStorage.getItem('charlies-odds-current-user');
    if (currentUserId) {
      const users = JSON.parse(localStorage.getItem('charlies-odds-users') || '[]');
      const foundUser = users.find((u: any) => u.id === currentUserId);
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        setUser({
          ...userWithoutPassword,
          createdAt: new Date(foundUser.createdAt)
        });
        setIsAuthenticated(true);
      }
    }
  }, []);

  const login = (usernameOrEmail: string, password: string): boolean => {
    try {
      const users = JSON.parse(localStorage.getItem('charlies-odds-users') || '[]');
      const foundUser = users.find((u: any) => 
        (u.username.toLowerCase() === usernameOrEmail.toLowerCase() || 
         u.email.toLowerCase() === usernameOrEmail.toLowerCase()) &&
        u.password === password
      );

      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        const userObj = {
          ...userWithoutPassword,
          createdAt: new Date(foundUser.createdAt)
        };
        
        setUser(userObj);
        setIsAuthenticated(true);
        localStorage.setItem('charlies-odds-current-user', foundUser.id);
        
        console.log('Login successful:', userObj.username);
        return true;
      }
      
      console.log('Login failed: Invalid credentials');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const users = JSON.parse(localStorage.getItem('charlies-odds-users') || '[]');
      
      // Check if user already exists
      const existingUser = users.find((u: any) => 
        u.username.toLowerCase() === username.toLowerCase() || 
        u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (existingUser) {
        return false;
      }

      const newUser = {
        id: `user-${Date.now()}`,
        username,
        email,
        password,
        balance: 1000,
        isAdmin: false,
        createdAt: new Date().toISOString(),
        stats: { totalBets: 0, totalWins: 0, totalLosses: 0, biggestWin: 0, biggestLoss: 0 }
      };

      users.push(newUser);
      localStorage.setItem('charlies-odds-users', JSON.stringify(users));

      // Auto-login the new user
      const { password: _, ...userWithoutPassword } = newUser;
      const userObj = {
        ...userWithoutPassword,
        createdAt: new Date(newUser.createdAt)
      };
      
      setUser(userObj);
      setIsAuthenticated(true);
      localStorage.setItem('charlies-odds-current-user', newUser.id);

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('charlies-odds-current-user');
    console.log('User logged out');
  };

  const updateBalance = (amount: number) => {
    if (!user) return;

    const newBalance = user.balance + amount;
    const updatedUser = { ...user, balance: newBalance };
    setUser(updatedUser);

    // Update in localStorage
    const users = JSON.parse(localStorage.getItem('charlies-odds-users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], balance: newBalance };
      localStorage.setItem('charlies-odds-users', JSON.stringify(users));
    }

    console.log(`Balance updated: ${amount >= 0 ? '+' : ''}${amount.toFixed(2)} -> $${newBalance.toFixed(2)}`);
  };

  const updateStats = (betAmount: number, winAmount: number) => {
    if (!user) return;

    const isWin = winAmount > betAmount;
    const profit = winAmount - betAmount;
    
    const updatedStats = {
      ...user.stats,
      totalBets: user.stats.totalBets + 1,
      totalWins: user.stats.totalWins + (isWin ? 1 : 0),
      totalLosses: user.stats.totalLosses + (isWin ? 0 : 1),
      biggestWin: Math.max(user.stats.biggestWin, profit),
      biggestLoss: Math.min(user.stats.biggestLoss, profit)
    };

    const updatedUser = { ...user, stats: updatedStats };
    setUser(updatedUser);

    // Update in localStorage
    const users = JSON.parse(localStorage.getItem('charlies-odds-users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], stats: updatedStats };
      localStorage.setItem('charlies-odds-users', JSON.stringify(users));
    }
  };

  const value = {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    updateBalance,
    updateStats,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};