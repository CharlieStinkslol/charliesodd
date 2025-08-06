import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set up your Supabase project.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface User {
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
  total_wagered: number;
  total_won: number;
  biggest_win: number;
  biggest_loss: number;
  created_at: string;
  updated_at: string;
}

export interface Bet {
  id: string;
  user_id: string;
  game: string;
  bet_amount: number;
  win_amount: number;
  multiplier: number;
  result: any;
  created_at: string;
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