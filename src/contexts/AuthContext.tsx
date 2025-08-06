import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  password: string;
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
  login: (usernameOrEmail: string, password: string) => boolean;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateBalance: (amount: number) => void;
  updateStats: (betAmount: number, winAmount: number) => void;
  formatCurrency: (amount: number) => string;
  setCurrency: (currency: User['currency']) => void;
  claimDailyBonus: () => number;
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

const USER_KEY = 'charlies-odds-current-user';
const USERS_KEY = 'charlies-odds-users';

const xpForLevel = (level: number) => 100 * level;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const saveUser = (updated: User | null) => {
    setUser(updated);
    if (updated) {
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const index = users.findIndex(u => u.id === updated.id);
      if (index !== -1) {
        users[index] = updated;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };

  const login = (usernameOrEmail: string, password: string): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const found = users.find(u =>
      (u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
       u.email.toLowerCase() === usernameOrEmail.toLowerCase()) &&
      u.password === password
    );

    if (found) {
      saveUser(found);
      return true;
    }
    return false;
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const existing = users.find(u =>
      u.username.toLowerCase() === username.toLowerCase() ||
      u.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) return false;

    const newUser: User = {
      id: Date.now().toString(),
      username,
      email,
      password,
      balance: 1000,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      currency: 'USD',
      level: 1,
      experience: 0,
      lastDailyBonus: null,
      stats: {
        totalBets: 0,
        totalWins: 0,
        totalLosses: 0,
        totalWagered: 0,
        totalWon: 0,
        biggestWin: 0,
        biggestLoss: 0
      }
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    saveUser(newUser);
    return true;
  };

  const logout = () => {
    saveUser(null);
  };

  const updateBalance = (amount: number) => {
    if (!user) return;
    const updated = { ...user, balance: user.balance + amount };
    saveUser(updated);
  };

  const updateStats = (betAmount: number, winAmount: number) => {
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

    // XP and leveling
    let experience = user.experience + Math.floor(betAmount / 10);
    let level = user.level;
    let requirement = xpForLevel(level);
    while (experience >= requirement) {
      experience -= requirement;
      level += 1;
      requirement = xpForLevel(level);
    }

    const updated = { ...user, stats, experience, level };
    saveUser(updated);
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

  const setCurrency = (currency: User['currency']) => {
    if (!user) return;
    const updated = { ...user, currency };
    saveUser(updated);
  };

  const getLevelRewards = (level: number): LevelReward => {
    let reward = LEVEL_REWARDS[0];
    for (const r of LEVEL_REWARDS) {
      if (level >= r.level) reward = r;
    }
    return reward;
  };

  const claimDailyBonus = (): number => {
    if (!user) return 0;
    const today = new Date().toDateString();
    if (user.lastDailyBonus === today) return 0;
    const reward = getLevelRewards(user.level).dailyBonus;
    const updated = { ...user, lastDailyBonus: today, balance: user.balance + reward };
    saveUser(updated);
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

