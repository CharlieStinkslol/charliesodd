import { useEffect, useState } from 'react';
import { supabase, supabaseHelpers, localStorage_helpers } from '../lib/supabase';

interface GameSettings {
  enabled: boolean;
  minBet: number;
  maxBet: number;
  houseEdge: number;
}

export const useGameAccess = (gameName: string) => {
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const loadGameSettings = () => {
      if (useSupabase) {
        supabaseHelpers.getGameConfig().then(allConfig => {
          const config = allConfig.find(c => c.game_name === gameName);
          
          setGameSettings({
            enabled: config?.enabled ?? true,
            minBet: config?.min_bet ?? 0.01,
            maxBet: config?.max_bet ?? 1000,
            houseEdge: config?.house_edge ?? 1
          });
          
          setIsLoading(false);
        });
      } else {
        const allConfig = localStorage_helpers.getGameConfig();
        const config = allConfig.find(c => c.game_name === gameName);
        
        setGameSettings({
          enabled: config?.enabled ?? true,
          minBet: config?.min_bet ?? 0.01,
          maxBet: config?.max_bet ?? 1000,
          houseEdge: config?.house_edge ?? 1
        });
        
        setIsLoading(false);
      }
    };

    loadGameSettings();
  }, [gameName, useSupabase]);

  const validateBetAmount = (amount: number): { isValid: boolean; message?: string } => {
    if (!gameSettings) return { isValid: true };

    // Check minimum bet
    if (gameSettings.minBet && amount < gameSettings.minBet) {
      return {
        isValid: false,
        message: `Minimum bet is $${gameSettings.minBet.toFixed(2)}`
      };
    }

    // Check maximum bet
    if (gameSettings.maxBet && amount > gameSettings.maxBet) {
      return {
        isValid: false,
        message: `Maximum bet is $${gameSettings.maxBet.toFixed(2)}`
      };
    }

    return { isValid: true };
  };

  return {
    gameSettings,
    isLoading,
    isEnabled: gameSettings?.enabled ?? true,
    minBet: gameSettings?.minBet ?? 0.01,
    maxBet: gameSettings?.maxBet ?? 1000,
    validateBetAmount
  };
};