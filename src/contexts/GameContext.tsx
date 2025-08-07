import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, type GameBet as SupabaseGameBet, type GameSetting } from '../lib/supabase';
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

  const loadUserBets = async () => {
    if (!user) return;
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('game_bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Error loading bets:', error);
        return;
      }

      const formattedBets: GameBet[] = data.map(bet => ({
        id: bet.id,
        game: bet.game_name,
        betAmount: bet.bet_amount,
        winAmount: bet.win_amount,
        multiplier: bet.multiplier,
        timestamp: new Date(bet.created_at),
        result: bet.game_result
      }));

      setBets(formattedBets);
    } catch (error) {
      console.error('Error loading bets:', error);
    }
  };

  const loadUserGameSettings = async () => {
    if (!user) return;
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading game settings:', error);
        return;
      }

      const settings: GameSettings = {};
      data.forEach(setting => {
        if (!settings[setting.game_name]) {
          settings[setting.game_name] = {};
        }
        settings[setting.game_name][setting.setting_name] = setting.settings;
      });

      setGameSettings(settings);
    } catch (error) {
      console.error('Error loading game settings:', error);
    }
  };

  const addBet = async (bet: Omit<GameBet, 'id' | 'timestamp'>) => {
    if (!user) return;

    const newBet: GameBet = {
      ...bet,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    // Add to local state immediately for UI responsiveness
    const updatedBets = [newBet, ...bets].slice(0, 1000);
    setBets(updatedBets);

    // Save to database if Supabase is available
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('game_bets')
        .insert({
          user_id: user.id,
          game_name: bet.game,
          bet_amount: bet.betAmount,
          win_amount: bet.winAmount,
          multiplier: bet.multiplier,
          game_result: bet.result
        });

      if (error) {
        console.error('Error saving bet:', error);
      }
    } catch (error) {
      console.error('Error saving bet:', error);
    }
  };

  const clearHistory = () => {
    setBets([]);
    // Note: In production, you might want to soft-delete or archive bets instead
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

  const saveGameSettings = async (gameName: string, settings: any) => {
    if (!user) return;

    // Update local state
    const updatedSettings = {
      ...gameSettings,
      [gameName]: settings
    };
    setGameSettings(updatedSettings);

    // Save to database if Supabase is available
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('game_settings')
        .upsert({
          user_id: user.id,
          game_name: gameName,
          setting_name: 'default',
          settings: settings
        });

      if (error) {
        console.error('Error saving game settings:', error);
      }
    } catch (error) {
      console.error('Error saving game settings:', error);
    }
  };

  const loadGameSettings = (gameName: string) => {
    return gameSettings[gameName]?.default || {};
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