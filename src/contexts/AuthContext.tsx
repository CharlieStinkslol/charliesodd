import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, type Profile, type UserStats } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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

  // Initialize Supabase auth state
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        setLoading(false);
        return;
      }

      // Get user stats
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (statsError) {
        console.error('Error loading stats:', statsError);
        setLoading(false);
        return;
      }

      const userObj: User = {
        id: profile.id,
        username: profile.username,
        email: authUser.email || '',
        balance: profile.balance,
        isAdmin: profile.is_admin,
        level: profile.level,
        experience: profile.experience,
        lastDailyBonus: profile.last_daily_bonus,
        currency: profile.currency,
        createdAt: profile.created_at,
        stats: {
          totalBets: stats.total_bets,
          totalWins: stats.total_wins,
          totalLosses: stats.total_losses,
          biggestWin: stats.biggest_win,
          biggestLoss: stats.biggest_loss,
          totalWagered: stats.total_wagered,
          totalWon: stats.total_won
        }
      };

      setUser(userObj);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!supabase) {
      console.error('Supabase not initialized');
      return false;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    if (!supabase) {
      console.error('Supabase not initialized');
      return false;
    }

    try {
      // Check if username already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile && !checkError) {
        return false;
      }

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Registration error:', error);
        return false;
      }

      if (!data.user) {
        return false;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username,
          email,
          balance: 1000,
          is_admin: false,
          level: 1,
          experience: 0,
          currency: 'USD'
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
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

  const updateBalance = async (amount: number) => {
    if (!user) return;
    if (!supabase) {
      // Fallback to local state update if Supabase not available
      setUser(prev => prev ? { ...prev, balance: prev.balance + amount } : null);
      return;
    }

    const newBalance = user.balance + amount;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating balance:', error);
        return;
      }

      setUser(prev => prev ? { ...prev, balance: newBalance } : null);
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  const addExperience = async (amount: number) => {
    if (!user) return;
    if (!supabase) return;

    let newExperience = user.experience + amount;
    let newLevel = user.level;
    
    // Check for level ups
    while (newExperience >= getNextLevelRequirement()) {
      newExperience -= getNextLevelRequirement();
      newLevel++;
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          experience: newExperience, 
          level: newLevel 
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating experience:', error);
        return;
      }

      setUser(prev => prev ? { ...prev, experience: newExperience, level: newLevel } : null);
    } catch (error) {
      console.error('Error updating experience:', error);
    }
  };

  const claimDailyBonus = async (): Promise<number> => {
    if (!user) return 0;
    if (!supabase) return 0;

    const today = new Date().toISOString().split('T')[0];
    if (user.lastDailyBonus === today) return 0;

    const levelRewards = getLevelRewards(user.level);
    const bonusAmount = levelRewards.dailyBonus;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          balance: user.balance + bonusAmount,
          last_daily_bonus: today 
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error claiming daily bonus:', error);
        return 0;
      }

      setUser(prev => prev ? { 
        ...prev, 
        balance: prev.balance + bonusAmount, 
        lastDailyBonus: today 
      } : null);

      return bonusAmount;
    } catch (error) {
      console.error('Error claiming daily bonus:', error);
      return 0;
    }
  };

  const updateStats = (betAmount: number, winAmount: number) => {
    // Stats are now updated automatically via database triggers
    // Add experience for betting
    addExperience(Math.floor(betAmount / 10)); // 1 XP per $10 bet
  };

  const setCurrency = async (currency: 'USD' | 'GBP' | 'EUR' | 'BTC' | 'ETH' | 'LTC') => {
    if (!user) return;
    if (!supabase) {
      // Fallback to local state update
      setUser(prev => prev ? { ...prev, currency } : null);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ currency })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating currency:', error);
        return;
      }

      setUser(prev => prev ? { ...prev, currency } : null);
    } catch (error) {
      console.error('Error updating currency:', error);
    }
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