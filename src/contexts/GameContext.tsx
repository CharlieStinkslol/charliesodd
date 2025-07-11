import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface GameContextType {
  bets: GameBet[];
  stats: GameStats;
  seed: string;
  addBet: (bet: Omit<GameBet, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  resetStats: () => void;
  setSeed: (seed: string) => void;
  generateSeededRandom: () => number;
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

  useEffect(() => {
    // Load saved bets
    const savedBets = localStorage.getItem('charlies-odds-bets');
    if (savedBets) {
      setBets(JSON.parse(savedBets));
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
  }, []);

  const addBet = (bet: Omit<GameBet, 'id' | 'timestamp'>) => {
    const newBet: GameBet = {
      ...bet,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    const updatedBets = [newBet, ...bets].slice(0, 1000); // Keep last 1000 bets
    setBets(updatedBets);
    localStorage.setItem('charlies-odds-bets', JSON.stringify(updatedBets));
  };

  const clearHistory = () => {
    setBets([]);
    localStorage.removeItem('charlies-odds-bets');
  };

  const resetStats = () => {
    setBets([]);
    localStorage.removeItem('charlies-odds-bets');
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

  const stats: GameStats = {
    totalBets: bets.length,
    totalWins: bets.filter(bet => bet.winAmount > bet.betAmount).length,
    totalLosses: bets.filter(bet => bet.winAmount < bet.betAmount).length,
    totalWagered: bets.reduce((sum, bet) => sum + bet.betAmount, 0),
    totalWon: bets.reduce((sum, bet) => sum + bet.winAmount, 0),
    biggestWin: Math.max(...bets.map(bet => bet.winAmount - bet.betAmount), 0),
    biggestLoss: Math.min(...bets.map(bet => bet.winAmount - bet.betAmount), 0),
    winRate: bets.length > 0 ? (bets.filter(bet => bet.winAmount > bet.betAmount).length / bets.length) * 100 : 0,
  };

  const value = {
    bets,
    stats,
    seed,
    addBet,
    clearHistory,
    resetStats,
    setSeed,
    generateSeededRandom,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};