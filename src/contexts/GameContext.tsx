import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { localStorage_helpers, type GameBet as LocalGameBet, type GameSetting } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface GameBet {
  id: string;
  game: string;
  betAmount: number;
  winAmount: number;
  multiplier: number;
  timestamp: Date;
  result: any;
}

interface GameStats {
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  biggestLoss: number;
  winRate: number;
}

interface GameSettings {
  [gameName: string]: {
    [key: string]: any;
  };
}

interface GameContextType {
  bets: GameBet[];
  stats: GameStats;
  seed: string;
  gameSettings: GameSettings;
  addBet: (bet: Omit<GameBet, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  resetStats: () => void;
  setSeed: (seed: string) => void;
  generateSeededRandom: () => number;
  saveGameSettings: (gameName: string, settings: any) => void;
  loadGameSettings: (gameName: string) => any;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [bets, setBets] = useState<GameBet[]>([]);
  const [seed, setSeedState] = useState<string>('');
  const [seedCounter, setSeedCounter] = useState<number>(0);
  const [gameSettings, setGameSettings] = useState<GameSettings>({});
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserBets();
      loadUserGameSettings();
    }
    
    // Load or generate seed
    const savedSeed = localStorage.getItem('charlies-odds-seed');
    if (savedSeed) {
      setSeedState(savedSeed);
    } else {
      const newSeed = Math.random().toString(36).substring(2, 15);
      setSeedState(newSeed);
      localStorage.setItem('charlies-odds-seed', newSeed);
    }
  }, [user]);

  const loadUserBets = () => {
    if (!user) return;

    const allBets = localStorage_helpers.getBets();
    const userBets = allBets.filter(bet => bet.user_id === user.id);
    
    const formattedBets: GameBet[] = userBets.map(bet => ({
      id: bet.id,
      game: bet.game_name,
      betAmount: bet.bet_amount,
      winAmount: bet.win_amount,
      multiplier: bet.multiplier,
      timestamp: new Date(bet.created_at),
      result: bet.game_result
    }));

    setBets(formattedBets.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  };

  const loadUserGameSettings = () => {
    if (!user) return;

    const savedSettings = localStorage.getItem(`charlies-odds-game-settings-${user.id}`);
    if (savedSettings) {
      setGameSettings(JSON.parse(savedSettings));
    }
  };

  const addBet = (bet: Omit<GameBet, 'id' | 'timestamp'>) => {
    if (!user) return;

    const newBet: GameBet = {
      ...bet,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    // Add to local state
    const updatedBets = [newBet, ...bets].slice(0, 1000);
    setBets(updatedBets);

    // Save to localStorage
    const allBets = localStorage_helpers.getBets();
    const localBet: LocalGameBet = {
      id: newBet.id,
      user_id: user.id,
      game_name: bet.game as any,
      bet_amount: bet.betAmount,
      win_amount: bet.winAmount,
      multiplier: bet.multiplier,
      game_result: bet.result,
      created_at: newBet.timestamp.toISOString()
    };
    
    allBets.push(localBet);
    localStorage_helpers.saveBets(allBets);
  };

  const clearHistory = () => {
    setBets([]);
    if (user) {
      const allBets = localStorage_helpers.getBets();
      const filteredBets = allBets.filter(bet => bet.user_id !== user.id);
      localStorage_helpers.saveBets(filteredBets);
    }
  };

  const resetStats = () => {
    setBets([]);
  };

  const setSeed = (newSeed: string) => {
    setSeedState(newSeed);
    setSeedCounter(0);
    localStorage.setItem('charlies-odds-seed', newSeed);
  };

  const generateSeededRandom = (): number => {
    // Simple seeded random number generator
    const seedStr = seed + seedCounter.toString();
    setSeedCounter(prev => prev + 1);
    
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      const char = seedStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash) / 2147483647;
  };

  const saveGameSettings = (gameName: string, settings: any) => {
    if (!user) return;

    const updatedSettings = {
      ...gameSettings,
      [gameName]: settings
    };
    setGameSettings(updatedSettings);
    localStorage.setItem(`charlies-odds-game-settings-${user.id}`, JSON.stringify(updatedSettings));
  };

  const loadGameSettings = (gameName: string) => {
    return gameSettings[gameName] || {};
  };

  const stats: GameStats = {
    totalBets: bets.length || 0,
    totalWins: bets.filter(bet => bet.winAmount > bet.betAmount).length || 0,
    totalLosses: bets.filter(bet => bet.winAmount < bet.betAmount).length || 0,
    totalWagered: bets.reduce((sum, bet) => sum + bet.betAmount, 0) || 0,
    totalWon: bets.reduce((sum, bet) => sum + bet.winAmount, 0) || 0,
    biggestWin: bets.length ? Math.max(...bets.map(bet => bet.winAmount - bet.betAmount), 0) : 0,
    biggestLoss: bets.length ? Math.min(...bets.map(bet => bet.winAmount - bet.betAmount), 0) : 0,
    winRate: bets.length > 0 ? (bets.filter(bet => bet.winAmount > bet.betAmount).length / bets.length) * 100 : 0,
  };

  const value = {
    bets,
    stats,
    seed,
    gameSettings,
    addBet,
    clearHistory,
    resetStats,
    setSeed,
    generateSeededRandom,
    saveGameSettings,
    loadGameSettings,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};