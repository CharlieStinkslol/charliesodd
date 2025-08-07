import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface GameSettings {
  enabled: boolean;
  minBet: number;
  maxBet: number;
  houseEdge: number;
}

export const useGameAccess = (gameName: string) => {
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGameSettings = async () => {
      if (!supabase) {
        // Fallback to localStorage if Supabase not available
        const savedSettings = localStorage.getItem('charlies-odds-admin-game-settings');
        if (savedSettings) {
          const allSettings = JSON.parse(savedSettings);
          const settings = allSettings[gameName];
          setGameSettings(settings || {
            enabled: true,
            minBet: 0.01,
            maxBet: 1000,
            houseEdge: 1
          });
        } else {
          setGameSettings({
            enabled: true,
            minBet: 0.01,
            maxBet: 1000,
            houseEdge: 1
          });
        }
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_game_config')
          .select('*')
          .eq('game_name', gameName)
          .single();

        if (error || !data) {
          // Use default settings if not found
          setGameSettings({
            enabled: true,
            minBet: 0.01,
            maxBet: 1000,
            houseEdge: 1
          });
        } else {
          setGameSettings({
            enabled: data.enabled,
            minBet: data.min_bet,
            maxBet: data.max_bet,
            houseEdge: data.house_edge
          });
        }
      } catch (error) {
        console.error('Error loading game settings:', error);
        setGameSettings({
          enabled: true,
          minBet: 0.01,
          maxBet: 1000,
          houseEdge: 1
        });
      }
      
      setIsLoading(false);
    };

    loadGameSettings();
  }, [gameName]);

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