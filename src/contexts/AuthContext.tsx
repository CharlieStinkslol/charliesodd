import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// Types for user statistics
interface UserStats {
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  biggestLoss: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  isAdmin: boolean;
  createdAt: string;
  currency: 'USD' | 'GBP' | 'EUR' | 'BTC' | 'ETH' | 'LTC';
  level: number;
  experience: number; // XP towards next level
  lastDailyBonus: string | null;
  stats: UserStats;
}

interface LevelReward {
  level: number;
  title: string;
  dailyBonus: number;
}

const LEVEL_REWARDS: LevelReward[] = [
  { level: 1, title: 'Novice Gambler', dailyBonus: 25 },
  { level: 5, title: 'Experienced Player', dailyBonus: 45 },
  { level: 10, title: 'High Roller', dailyBonus: 70 },
  { level: 15, title: 'VIP Player', dailyBonus: 95 },
  { level: 25, title: 'Elite Gambler', dailyBonus: 145 },
  { level: 50, title: 'Luck Legend', dailyBonus: 270 }
];

interface AuthContextType {
  user: User | null;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
  updateStats: (betAmount: number, winAmount: number) => Promise<void>;
  formatCurrency: (amount: number) => string;
  setCurrency: (currency: User['currency']) => Promise<void>;
  claimDailyBonus: () => Promise<number>;
  getNextLevelRequirement: () => number;
  getLevelRewards: (level: number) => LevelReward;
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

const xpForLevel = (level: number) => 100 * level;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*, user_stats(*)')
      .eq('id', authUser.id)
      .single();

    if (error || !data) {
      console.error('Error fetching user:', error);
      setUser(null);
      return;
    }

    const profile: User = {
      id: data.id,
      username: data.username,
      email: data.email,
      balance: Number(data.balance),
      isAdmin: data.is_admin,
      createdAt: data.created_at,
      currency: data.currency,
      level: data.level,
      experience: data.experience,
      lastDailyBonus: data.last_daily_bonus,
      stats: {
        totalBets: data.user_stats?.total_bets ?? 0,
        totalWins: data.user_stats?.total_wins ?? 0,
        totalLosses: data.user_stats?.total_losses ?? 0,
        totalWagered: Number(data.user_stats?.total_wagered ?? 0),
        totalWon: Number(data.user_stats?.total_won ?? 0),
        biggestWin: Number(data.user_stats?.biggest_win ?? 0),
        biggestLoss: Number(data.user_stats?.biggest_loss ?? 0)
      }
    };

    setUser(profile);
  };

  useEffect(() => {
    fetchUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      let email = usernameOrEmail;
      if (!usernameOrEmail.includes('@')) {
        const { data, error } = await supabase
          .from('users')
          .select('email')
          .eq('username', usernameOrEmail.toLowerCase())
          .single();
        if (error || !data) return false;
        email = data.email;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) return false;
      await fetchUser();
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });
      if (signUpError || !signUpData.user) return false;

      const userId = signUpData.user.id;
      const { error: insertError } = await supabase.from('users').insert({
        id: userId,
        username,
        email,
        balance: 1000,
        is_admin: false,
        level: 1,
        experience: 0,
        last_daily_bonus: null,
        currency: 'USD'
      });
      if (insertError) return false;

      await supabase.from('user_stats').insert({
        user_id: userId,
        total_bets: 0,
        total_wins: 0,
        total_losses: 0,
        total_wagered: 0,
        total_won: 0,
        biggest_win: 0,
        biggest_loss: 0
      });

      await fetchUser();
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateBalance = async (amount: number) => {
    if (!user) return;
    const newBalance = user.balance + amount;
    const { error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', user.id);
    if (error) {
      console.error('Error updating balance:', error);
      return;
    }
    setUser({ ...user, balance: newBalance });
  };

  const updateStats = async (betAmount: number, winAmount: number) => {
    if (!user) return;
    const stats = { ...user.stats };
    stats.totalBets += 1;
    stats.totalWagered += betAmount;
    stats.totalWon += winAmount;
    if (winAmount > betAmount) stats.totalWins += 1;
    if (winAmount < betAmount) stats.totalLosses += 1;
    const profit = winAmount - betAmount;
    if (profit > stats.biggestWin) stats.biggestWin = profit;
    if (profit < stats.biggestLoss) stats.biggestLoss = profit;

    let experience = user.experience + Math.floor(betAmount / 10);
    let level = user.level;
    let requirement = xpForLevel(level);
    while (experience >= requirement) {
      experience -= requirement;
      level += 1;
      requirement = xpForLevel(level);
    }

    const { error: statsError } = await supabase
      .from('user_stats')
      .update({
        total_bets: stats.totalBets,
        total_wins: stats.totalWins,
        total_losses: stats.totalLosses,
        total_wagered: stats.totalWagered,
        total_won: stats.totalWon,
        biggest_win: stats.biggestWin,
        biggest_loss: stats.biggestLoss
      })
      .eq('user_id', user.id);

    const { error: userError } = await supabase
      .from('users')
      .update({ experience, level })
      .eq('id', user.id);

    if (statsError || userError) {
      console.error('Error updating stats:', statsError || userError);
      return;
    }

    setUser({ ...user, stats, experience, level });
  };

  const formatCurrency = (amount: number): string => {
    const currency = user?.currency || 'USD';
    const symbols: Record<User['currency'], string> = {
      USD: '$',
      GBP: '£',
      EUR: '€',
      BTC: '₿',
      ETH: 'Ξ',
      LTC: 'Ł'
    };
    const symbol = symbols[currency];
    const decimals = ['BTC', 'ETH', 'LTC'].includes(currency) ? 8 : 2;
    return `${symbol}${amount.toFixed(decimals)}`;
  };

  const setCurrency = async (currency: User['currency']) => {
    if (!user) return;
    const { error } = await supabase
      .from('users')
      .update({ currency })
      .eq('id', user.id);
    if (error) {
      console.error('Error updating currency:', error);
      return;
    }
    setUser({ ...user, currency });
  };

  const getLevelRewards = (level: number): LevelReward => {
    let reward = LEVEL_REWARDS[0];
    for (const r of LEVEL_REWARDS) {
      if (level >= r.level) reward = r;
    }
    return reward;
  };

  const claimDailyBonus = async (): Promise<number> => {
    if (!user) return 0;
    const today = new Date().toDateString();
    if (user.lastDailyBonus === today) return 0;
    const reward = getLevelRewards(user.level).dailyBonus;
    const newBalance = user.balance + reward;
    const { error } = await supabase
      .from('users')
      .update({ last_daily_bonus: today, balance: newBalance })
      .eq('id', user.id);
    if (error) {
      console.error('Error claiming daily bonus:', error);
      return 0;
    }
    setUser({ ...user, lastDailyBonus: today, balance: newBalance });
    return reward;
  };

  const getNextLevelRequirement = () => {
    const lvl = user?.level || 1;
    return xpForLevel(lvl);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateBalance,
    updateStats,
    formatCurrency,
    setCurrency,
    claimDailyBonus,
    getNextLevelRequirement,
    getLevelRewards
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

