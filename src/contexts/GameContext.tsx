import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
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

  useEffect(() => {
    loadUserBets();
    
    const savedSeed = localStorage.getItem('charlies-odds-seed');
    if (savedSeed) {
      setSeedState(savedSeed);
    } else {
      const newSeed = Math.random().toString(36).substring(2, 15);
      setSeedState(newSeed);
      localStorage.setItem('charlies-odds-seed', newSeed);
    }

    const savedSettings = localStorage.getItem('charlies-odds-game-settings');
    if (savedSettings) {
      setGameSettings(JSON.parse(savedSettings));
    }
  }, []);

  const loadUserBets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: betsData, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      if (betsData) {
        const formattedBets = betsData.map((bet: any) => ({
          id: bet.id,
          game: bet.game,
          betAmount: Number(bet.bet_amount),
          winAmount: Number(bet.win_amount),
          multiplier: Number(bet.multiplier),
          timestamp: new Date(bet.created_at),
          result: bet.result
        }));
        setBets(formattedBets);
      }
    } catch (error) {
      console.error('Error loading bets:', error);
    }
  };

  const addBet = async (bet: Omit<GameBet, 'id' | 'timestamp'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save to database
      const { data: newBet, error } = await supabase
        .from('bets')
        .insert({
          user_id: user.id,
          game: bet.game,
          bet_amount: bet.betAmount,
          win_amount: bet.winAmount,
          multiplier: bet.multiplier,
          result: bet.result
        })
        .select()
        .single();

      if (error) throw error;

      if (newBet) {
        const formattedBet: GameBet = {
          id: newBet.id,
          game: newBet.game,
          betAmount: Number(newBet.bet_amount),
          winAmount: Number(newBet.win_amount),
          multiplier: Number(newBet.multiplier),
          timestamp: new Date(newBet.created_at),
          result: newBet.result
        };
        
        setBets(prev => [formattedBet, ...prev].slice(0, 1000));
      }
    } catch (error) {
      console.error('Error saving bet:', error);
      // Fallback to local storage
      const newBet: GameBet = {
        ...bet,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      
      const updatedBets = [newBet, ...bets].slice(0, 1000);
      setBets(updatedBets);
    }
  };

  const clearHistory = () => {
    setBets([]);
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
    const seedStr = seed + seedCounter.toString();
    setSeedCounter(prev => prev + 1);
    
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      const char = seedStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash) / 2147483647;
  };

  const saveGameSettings = async (gameName: string, settings: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to localStorage
        const updatedSettings = { ...gameSettings, [gameName]: settings };
        setGameSettings(updatedSettings);
        localStorage.setItem('charlies-odds-game-settings', JSON.stringify(updatedSettings));
        return;
      }

      // Save to database
      await supabase
        .from('game_settings')
        .upsert({
          user_id: user.id,
          game_name: gameName,
          setting_name: 'default',
          settings: settings
        });
    } catch (error) {
      console.error('Error saving game settings:', error);
    }
    
    // Also save locally for immediate access
    const updatedSettings = {
      ...gameSettings,
      [gameName]: settings
    };
    setGameSettings(updatedSettings);
    localStorage.setItem('charlies-odds-game-settings', JSON.stringify(updatedSettings));
  };

  const loadGameSettings = async (gameName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: settingsData } = await supabase
          .from('game_settings')
          .select('settings')
          .eq('user_id', user.id)
          .eq('game_name', gameName)
          .eq('setting_name', 'default')
          .single();

        if (settingsData) {
          return settingsData.settings;
        }
      }
    } catch (error) {
      console.error('Error loading game settings:', error);
    }
    
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