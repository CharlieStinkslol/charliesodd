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
      try {
        const { data: configData, error } = await supabase
          .from('admin_game_config')
          .select('*')
          .eq('game_name', gameName)
          .single();

        if (error) throw error;

        if (configData) {
          setGameSettings({
            enabled: configData.enabled,
            minBet: Number(configData.min_bet),
            maxBet: Number(configData.max_bet),
            houseEdge: Number(configData.house_edge)
          });
        } else {
          // Default settings if not found
          setGameSettings({
            enabled: true,
            minBet: 0.01,
            maxBet: 1000,
            houseEdge: 1
          });
        }
      } catch (error) {
        console.error('Error loading game settings:', error);
        // Fallback to default settings
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

    if (gameSettings.minBet && amount < gameSettings.minBet) {
      return {
        isValid: false,
        message: `Minimum bet is $${gameSettings.minBet.toFixed(2)}`
      };
    }

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