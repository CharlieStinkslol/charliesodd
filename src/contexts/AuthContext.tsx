import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, supabaseHelpers, localStorage_helpers, type Profile, type UserStats } from '../lib/supabase';

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  isAdmin: boolean;
  createdAt: string;
  level: number;
  experience: number;
  lastDailyBonus: string | null;
  stats: {
    totalBets: number;
    totalWins: number;
    totalLosses: number;
    biggestWin: number;
    biggestLoss: number;
    totalWagered: number;
    totalWon: number;
  };
  currency: 'USD' | 'GBP' | 'EUR' | 'BTC' | 'ETH' | 'LTC';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateBalance: (amount: number) => void;
  updateStats: (betAmount: number, winAmount: number) => void;
  addExperience: (amount: number) => void;
  claimDailyBonus: () => number;
  getNextLevelRequirement: () => number;
  getLevelRewards: (level: number) => { dailyBonus: number; title: string };
  setCurrency: (currency: 'USD' | 'GBP' | 'EUR' | 'BTC' | 'ETH' | 'LTC') => void;
  formatCurrency: (amount: number) => string;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);
  const [useSupabase, setUseSupabase] = useState(false);

  // Check if Supabase is configured
  useEffect(() => {
    const checkSupabaseConfig = () => {
      const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
      const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
      setUseSupabase(hasUrl && hasKey);
    };
    
    checkSupabaseConfig();
  }, []);

  // Initialize from localStorage
  useEffect(() => {
    const currentUserId = localStorage.getItem('charlies-odds-current-user');
    if (currentUserId) {
      const users = localStorage_helpers.getUsers();
      const foundUser = users.find(u => u.id === currentUserId);
      if (foundUser) {
        const userStats = localStorage_helpers.getUserStats();
        const stats = userStats.find(s => s.user_id === foundUser.id);
        
        const userObj: User = {
          id: foundUser.id,
          username: foundUser.username,
          email: foundUser.email,
          balance: foundUser.balance,
          isAdmin: foundUser.is_admin,
          level: foundUser.level,
          experience: foundUser.experience,
          lastDailyBonus: foundUser.last_daily_bonus,
          currency: foundUser.currency,
          createdAt: foundUser.created_at,
          stats: {
            totalBets: stats?.total_bets || 0,
            totalWins: stats?.total_wins || 0,
            totalLosses: stats?.total_losses || 0,
            biggestWin: stats?.biggest_win || 0,
            biggestLoss: stats?.biggest_loss || 0,
            totalWagered: stats?.total_wagered || 0,
            totalWon: stats?.total_won || 0
          }
        };

        setUser(userObj);
        setIsAuthenticated(true);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (useSupabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          console.error('Supabase login error:', error);
          return false;
        }
        
        if (data.user) {
          const profile = await supabaseHelpers.getProfile(data.user.id);
          if (profile) {
            const userStats = await supabaseHelpers.getUserStats(data.user.id);
            
            const userObj: User = {
              id: profile.id,
              username: profile.username,
              email: profile.email,
              balance: profile.balance,
              isAdmin: profile.is_admin,
              level: profile.level,
              experience: profile.experience,
              lastDailyBonus: profile.last_daily_bonus,
              currency: profile.currency,
              createdAt: profile.created_at,
              stats: {
                totalBets: userStats?.total_bets || 0,
                totalWins: userStats?.total_wins || 0,
                totalLosses: userStats?.total_losses || 0,
                biggestWin: userStats?.biggest_win || 0,
                biggestLoss: userStats?.biggest_loss || 0,
                totalWagered: userStats?.total_wagered || 0,
                totalWon: userStats?.total_won || 0
              }
            };

            setUser(userObj);
            setIsAuthenticated(true);
            return true;
          }
        }
        
        return false;
      } catch (error) {
        console.error('Login error:', error);
        return false;
      }
    } else {
      // Fallback to localStorage
      const users = localStorage_helpers.getUsers();
      const foundUser = users.find(u => u.email === email);
      
      if (!foundUser) {
        return false;
      }

      localStorage.setItem('charlies-odds-current-user', foundUser.id);
      
      const userStats = localStorage_helpers.getUserStats();
      const stats = userStats.find(s => s.user_id === foundUser.id);
      
      const userObj: User = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        balance: foundUser.balance,
        isAdmin: foundUser.is_admin,
        level: foundUser.level,
        experience: foundUser.experience,
        lastDailyBonus: foundUser.last_daily_bonus,
        currency: foundUser.currency,
        createdAt: foundUser.created_at,
        stats: {
          totalBets: stats?.total_bets || 0,
          totalWins: stats?.total_wins || 0,
          totalLosses: stats?.total_losses || 0,
          biggestWin: stats?.biggest_win || 0,
          biggestLoss: stats?.biggest_loss || 0,
          totalWagered: stats?.total_wagered || 0,
          totalWon: stats?.total_won || 0
        }
      };

      setUser(userObj);
      setIsAuthenticated(true);
      return true;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    if (useSupabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        
        if (error) {
          console.error('Supabase registration error:', error);
          return false;
        }
        
        if (data.user) {
          // Create profile in database
          const profile: Omit<Profile, 'created_at' | 'updated_at'> = {
            id: data.user.id,
            username,
            email,
            balance: 1000,
            is_admin: false,
            level: 1,
            experience: 0,
            last_daily_bonus: null,
            currency: 'USD'
          };
          
          const success = await supabaseHelpers.createProfile(profile);
          if (success) {
            const userObj: User = {
              id: data.user.id,
              username,
              email,
              balance: 1000,
              isAdmin: false,
              level: 1,
              experience: 0,
              lastDailyBonus: null,
              currency: 'USD',
              createdAt: new Date().toISOString(),
              stats: {
                totalBets: 0,
                totalWins: 0,
                totalLosses: 0,
                biggestWin: 0,
                biggestLoss: 0,
                totalWagered: 0,
                totalWon: 0
              }
            };

            setUser(userObj);
            setIsAuthenticated(true);
            return true;
          }
        }
        
        return false;
      } catch (error) {
        console.error('Registration error:', error);
        return false;
      }
    } else {
      // Fallback to localStorage
      const users = localStorage_helpers.getUsers();
      
      // Check if username or email already exists
      if (users.find(u => u.username === username || u.email === email)) {
        return false;
      }

      const newUser: Profile = {
        id: Date.now().toString(),
        username,
        email,
        balance: 1000,
        is_admin: false,
        level: 1,
        experience: 0,
        last_daily_bonus: null,
        currency: 'USD',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const newStats: UserStats = {
        id: Date.now().toString() + '_stats',
        user_id: newUser.id,
        total_bets: 0,
        total_wins: 0,
        total_losses: 0,
        biggest_win: 0,
        biggest_loss: 0,
        total_wagered: 0,
        total_won: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      users.push(newUser);
      localStorage_helpers.saveUsers(users);
      
      const allStats = localStorage_helpers.getUserStats();
      allStats.push(newStats);
      localStorage_helpers.saveUserStats(allStats);

      localStorage.setItem('charlies-odds-current-user', newUser.id);

      const userObj: User = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        balance: newUser.balance,
        isAdmin: newUser.is_admin,
        level: newUser.level,
        experience: newUser.experience,
        lastDailyBonus: newUser.last_daily_bonus,
        currency: newUser.currency,
        createdAt: newUser.created_at,
        stats: {
          totalBets: 0,
          totalWins: 0,
          totalLosses: 0,
          biggestWin: 0,
          biggestLoss: 0,
          totalWagered: 0,
          totalWon: 0
        }
      };

      setUser(userObj);
      setIsAuthenticated(true);
      return true;
    }
  };

  const logout = () => {
    if (useSupabase) {
      supabase.auth.signOut();
    } else {
      localStorage.removeItem('charlies-odds-current-user');
    }
    setUser(null);
    setIsAuthenticated(false);
  };
  
  const getNextLevelRequirement = (): number => {
    if (!user) return 100;
    return user.level * 100; // Each level requires level * 100 XP
  };

  const getLevelRewards = (level: number) => {
    const baseBonus = 25;
    const bonusPerLevel = 5;
    
    const titles = [
      'Novice Gambler', 'Casual Player', 'Regular Bettor', 'Experienced Player', 'Skilled Gambler',
      'Expert Player', 'Master Bettor', 'High Roller', 'VIP Player', 'Elite Gambler',
      'Legendary Player', 'Casino Royalty', 'Gambling Guru', 'Fortune Master', 'Luck Legend'
    ];
    
    return {
      dailyBonus: baseBonus + (level - 1) * bonusPerLevel,
      title: titles[Math.min(level - 1, titles.length - 1)] || `Level ${level} Player`
    };
  };

  const updateBalance = (amount: number) => {
    if (!user) return;

    const newBalance = Math.max(0, user.balance + amount);
    
    if (useSupabase) {
      supabaseHelpers.updateProfile(user.id, { balance: newBalance });
    } else {
      const users = localStorage_helpers.getUsers();
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, balance: newBalance, updated_at: new Date().toISOString() } : u
      );
      localStorage_helpers.saveUsers(updatedUsers);
    }

    setUser(prev => prev ? { ...prev, balance: newBalance } : null);
  };

  const addExperience = (amount: number) => {
    if (!user) return;

    let newExperience = user.experience + amount;
    let newLevel = user.level;
    
    // Check for level ups
    while (newExperience >= getNextLevelRequirement()) {
      newExperience -= getNextLevelRequirement();
      newLevel++;
    }
    
    if (useSupabase) {
      supabaseHelpers.updateProfile(user.id, { 
        experience: newExperience, 
        level: newLevel 
      });
    } else {
      const users = localStorage_helpers.getUsers();
      const updatedUsers = users.map(u => 
        u.id === user.id ? { 
          ...u, 
          experience: newExperience, 
          level: newLevel,
          updated_at: new Date().toISOString() 
        } : u
      );
      localStorage_helpers.saveUsers(updatedUsers);
    }

    setUser(prev => prev ? { ...prev, experience: newExperience, level: newLevel } : null);
  };

  const claimDailyBonus = (): number => {
    if (!user) return 0;

    const today = new Date().toISOString().split('T')[0];
    if (user.lastDailyBonus === today) return 0;

    const levelRewards = getLevelRewards(user.level);
    const bonusAmount = levelRewards.dailyBonus;
    
    if (useSupabase) {
      supabaseHelpers.updateProfile(user.id, { 
        balance: user.balance + bonusAmount,
        last_daily_bonus: today
      });
    } else {
      const users = localStorage_helpers.getUsers();
      const updatedUsers = users.map(u => 
        u.id === user.id ? { 
          ...u, 
          balance: u.balance + bonusAmount,
          last_daily_bonus: today,
          updated_at: new Date().toISOString() 
        } : u
      );
      localStorage_helpers.saveUsers(updatedUsers);
    }

    setUser(prev => prev ? { 
      ...prev, 
      balance: prev.balance + bonusAmount, 
      lastDailyBonus: today 
    } : null);

    return bonusAmount;
  };

  const updateStats = (betAmount: number, winAmount: number) => {
    if (!user) return;

    const profit = winAmount - betAmount;
    const isWin = profit > 0;
    
    if (useSupabase) {
      // Stats are automatically updated via database triggers when bets are inserted
      // Just update local state for immediate UI feedback
      setUser(prev => prev ? {
        ...prev,
        stats: {
          totalBets: prev.stats.totalBets + 1,
          totalWins: prev.stats.totalWins + (isWin ? 1 : 0),
          totalLosses: prev.stats.totalLosses + (isWin ? 0 : 1),
          biggestWin: Math.max(prev.stats.biggestWin, profit),
          biggestLoss: Math.min(prev.stats.biggestLoss, profit),
          totalWagered: prev.stats.totalWagered + betAmount,
          totalWon: prev.stats.totalWon + winAmount
        }
      } : null);
    } else {
      const allStats = localStorage_helpers.getUserStats();
      const updatedStats = allStats.map(s => {
        if (s.user_id === user.id) {
          return {
            ...s,
            total_bets: s.total_bets + 1,
            total_wins: s.total_wins + (isWin ? 1 : 0),
            total_losses: s.total_losses + (isWin ? 0 : 1),
            biggest_win: Math.max(s.biggest_win, profit),
            biggest_loss: Math.min(s.biggest_loss, profit),
            total_wagered: s.total_wagered + betAmount,
            total_won: s.total_won + winAmount,
            updated_at: new Date().toISOString()
          };
        }
        return s;
      });
      localStorage_helpers.saveUserStats(updatedStats);

      // Update user stats in state
      const updatedUserStats = updatedStats.find(s => s.user_id === user.id);
      if (updatedUserStats) {
        setUser(prev => prev ? {
          ...prev,
          stats: {
            totalBets: updatedUserStats.total_bets,
            totalWins: updatedUserStats.total_wins,
            totalLosses: updatedUserStats.total_losses,
            biggestWin: updatedUserStats.biggest_win,
            biggestLoss: updatedUserStats.biggest_loss,
            totalWagered: updatedUserStats.total_wagered,
            totalWon: updatedUserStats.total_won
          }
        } : null);
      }
    }

    // Add experience for betting
    addExperience(Math.floor(betAmount / 10)); // 1 XP per $10 bet
  };

  const setCurrency = (currency: 'USD' | 'GBP' | 'EUR' | 'BTC' | 'ETH' | 'LTC') => {
    if (!user) return;

    if (useSupabase) {
      supabaseHelpers.updateProfile(user.id, { currency });
    } else {
      const users = localStorage_helpers.getUsers();
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, currency, updated_at: new Date().toISOString() } : u
      );
      localStorage_helpers.saveUsers(updatedUsers);
    }

    setUser(prev => prev ? { ...prev, currency } : null);
  };

  const formatCurrency = (amount: number): string => {
    if (!user) return `$${amount.toFixed(2)}`;
    
    switch (user.currency) {
      case 'GBP':
        return `£${amount.toFixed(2)}`;
      case 'EUR':
        return `€${amount.toFixed(2)}`;
      case 'BTC':
        return `₿${(amount / 100000).toFixed(8)}`;
      case 'ETH':
        return `Ξ${(amount / 4000).toFixed(6)}`;
      case 'LTC':
        return `Ł${(amount / 100).toFixed(4)}`;
      default:
        return `$${amount.toFixed(2)}`;
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
    addExperience,
    claimDailyBonus,
    getNextLevelRequirement,
    getLevelRewards,
    setCurrency,
    formatCurrency,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};