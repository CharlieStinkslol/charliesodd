import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Enhanced types for our database tables
export interface Profile {
  id: string;
  username: string;
  email: string;
  balance: number;
  is_admin: boolean;
  level: number;
  experience: number;
  last_daily_bonus: string | null;
  currency: 'USD' | 'GBP' | 'EUR' | 'BTC' | 'ETH' | 'LTC';
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_bets: number;
  total_wins: number;
  total_losses: number;
  biggest_win: number;
  biggest_loss: number;
  total_wagered: number;
  total_won: number;
  created_at: string;
  updated_at: string;
}

export interface GameBet {
  id: string;
  user_id: string;
  game_name: 'Dice' | 'Limbo' | 'Crash' | 'Blackjack' | 'Plinko' | 'Spin Wheel';
  bet_amount: number;
  win_amount: number;
  multiplier: number;
  game_result: any;
  created_at: string;
}

export interface GameSetting {
  id: string;
  user_id: string;
  game_name: string;
  setting_name: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface Suggestion {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'feature' | 'bug' | 'improvement' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'under-review' | 'planned' | 'in-progress' | 'completed' | 'rejected';
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
  };
  admin_responses?: Array<{
    id: string;
    response_text: string;
    created_at: string;
    profiles?: {
      username: string;
    };
  }>;
  user_vote?: {
    vote_type: 'up' | 'down';
  };
}

export interface SuggestionVote {
  id: string;
  suggestion_id: string;
  user_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
}

export interface AdminResponse {
  id: string;
  suggestion_id: string;
  admin_id: string;
  response_text: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'gaming' | 'social' | 'special';
  reward: number;
  icon: string;
  cooldown_hours: number;
  max_progress: number;
  is_active: boolean;
  created_at: string;
}

export interface UserTaskProgress {
  id: string;
  user_id: string;
  task_id: string;
  progress: number;
  completed: boolean;
  last_completed: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminGameConfig {
  id: string;
  game_name: 'dice' | 'limbo' | 'crash' | 'blackjack' | 'plinko' | 'spin-wheel';
  enabled: boolean;
  min_bet: number;
  max_bet: number;
  house_edge: number;
  updated_by: string | null;
  updated_at: string;
}