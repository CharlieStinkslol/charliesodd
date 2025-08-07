/*
  # Complete CharliesOdds Database Schema

  1. New Tables
    - `profiles` - User profile information linked to auth.users
    - `user_stats` - Detailed user statistics for gaming
    - `game_bets` - Individual bet records for all games
    - `game_settings` - User game configuration settings
    - `suggestions` - Community suggestions and feedback
    - `suggestion_votes` - Voting system for suggestions
    - `admin_responses` - Admin responses to suggestions
    - `tasks` - Available tasks for earning balance
    - `user_task_progress` - User progress on tasks
    - `admin_game_config` - Admin configuration for games

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for user data access
    - Admin-only policies for management tables

  3. Functions and Triggers
    - Auto-update timestamps
    - User stats aggregation
    - Balance validation
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  balance numeric DEFAULT 1000 CHECK (balance >= 0),
  is_admin boolean DEFAULT false,
  level integer DEFAULT 1 CHECK (level >= 1),
  experience integer DEFAULT 0 CHECK (experience >= 0),
  last_daily_bonus date,
  currency text DEFAULT 'USD' CHECK (currency IN ('USD', 'GBP', 'EUR', 'BTC', 'ETH', 'LTC')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_bets integer DEFAULT 0 CHECK (total_bets >= 0),
  total_wins integer DEFAULT 0 CHECK (total_wins >= 0),
  total_losses integer DEFAULT 0 CHECK (total_losses >= 0),
  total_wagered numeric DEFAULT 0 CHECK (total_wagered >= 0),
  total_won numeric DEFAULT 0 CHECK (total_won >= 0),
  biggest_win numeric DEFAULT 0,
  biggest_loss numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Game bets table
CREATE TABLE IF NOT EXISTS game_bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_name text NOT NULL CHECK (game_name IN ('Dice', 'Limbo', 'Crash', 'Blackjack', 'Plinko', 'Spin Wheel')),
  bet_amount numeric NOT NULL CHECK (bet_amount > 0),
  win_amount numeric DEFAULT 0 CHECK (win_amount >= 0),
  multiplier numeric DEFAULT 0 CHECK (multiplier >= 0),
  game_result jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_bets ENABLE ROW LEVEL SECURITY;

-- Game settings table
CREATE TABLE IF NOT EXISTS game_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_name text NOT NULL,
  setting_name text NOT NULL,
  settings jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, game_name, setting_name)
);

ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

-- Suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'feature' CHECK (category IN ('feature', 'bug', 'improvement', 'other')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'under-review', 'planned', 'in-progress', 'completed', 'rejected')),
  upvotes integer DEFAULT 0 CHECK (upvotes >= 0),
  downvotes integer DEFAULT 0 CHECK (downvotes >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Suggestion votes table
CREATE TABLE IF NOT EXISTS suggestion_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(suggestion_id, user_id)
);

ALTER TABLE suggestion_votes ENABLE ROW LEVEL SECURITY;

-- Admin responses table
CREATE TABLE IF NOT EXISTS admin_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_responses ENABLE ROW LEVEL SECURITY;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('daily', 'gaming', 'social', 'special')),
  reward numeric DEFAULT 0 CHECK (reward >= 0),
  icon text DEFAULT 'Star',
  cooldown_hours integer DEFAULT 0 CHECK (cooldown_hours >= 0),
  max_progress integer DEFAULT 1 CHECK (max_progress >= 1),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- User task progress table
CREATE TABLE IF NOT EXISTS user_task_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  progress integer DEFAULT 0 CHECK (progress >= 0),
  completed boolean DEFAULT false,
  last_completed timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, task_id)
);

ALTER TABLE user_task_progress ENABLE ROW LEVEL SECURITY;

-- Admin game config table
CREATE TABLE IF NOT EXISTS admin_game_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_name text UNIQUE NOT NULL CHECK (game_name IN ('dice', 'limbo', 'crash', 'blackjack', 'plinko', 'spin-wheel')),
  enabled boolean DEFAULT true,
  min_bet numeric DEFAULT 0.01 CHECK (min_bet > 0),
  max_bet numeric DEFAULT 1000 CHECK (max_bet >= min_bet),
  house_edge numeric DEFAULT 1 CHECK (house_edge >= 0 AND house_edge <= 100),
  updated_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_game_config ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_game_bets_user_id ON game_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_game_bets_game_name ON game_bets(game_name);
CREATE INDEX IF NOT EXISTS idx_game_bets_user_game ON game_bets(user_id, game_name);
CREATE INDEX IF NOT EXISTS idx_game_bets_created_at ON game_bets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_settings_user_id ON game_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_game_settings_game_name ON game_settings(game_name);
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_category ON suggestions(category);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_suggestion_id ON suggestion_votes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_user_id ON suggestion_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_progress_user_id ON user_task_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_progress_task_id ON user_task_progress(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can read own data" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- User stats policies
CREATE POLICY "Users can read own stats" ON user_stats
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own stats" ON user_stats
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own stats" ON user_stats
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all stats" ON user_stats
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Game bets policies
CREATE POLICY "Users can read own bets" ON game_bets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own bets" ON game_bets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all bets" ON game_bets
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Game settings policies
CREATE POLICY "Users can read own game settings" ON game_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own game settings" ON game_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Suggestions policies
CREATE POLICY "Anyone can read suggestions" ON suggestions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create suggestions" ON suggestions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own suggestions" ON suggestions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update suggestions" ON suggestions
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Suggestion votes policies
CREATE POLICY "Users can read votes" ON suggestion_votes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can vote" ON suggestion_votes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own votes" ON suggestion_votes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own votes" ON suggestion_votes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Admin responses policies
CREATE POLICY "Anyone can read admin responses" ON admin_responses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage responses" ON admin_responses
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Tasks policies
CREATE POLICY "Anyone can read active tasks" ON tasks
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage tasks" ON tasks
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- User task progress policies
CREATE POLICY "Users can read own task progress" ON user_task_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own task progress" ON user_task_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all task progress" ON user_task_progress
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Admin game config policies
CREATE POLICY "Anyone can read game config" ON admin_game_config
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage game config" ON admin_game_config
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_settings_updated_at
  BEFORE UPDATE ON game_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_task_progress_updated_at
  BEFORE UPDATE ON user_task_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_game_config_updated_at
  BEFORE UPDATE ON admin_game_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin game config
INSERT INTO admin_game_config (game_name, enabled, min_bet, max_bet, house_edge) VALUES
  ('dice', true, 0.01, 1000, 1),
  ('limbo', true, 0.01, 1000, 1),
  ('crash', true, 0.01, 1000, 1),
  ('blackjack', true, 0.01, 1000, 0.5),
  ('plinko', true, 0.01, 1000, 2),
  ('spin-wheel', true, 0.01, 1000, 5)
ON CONFLICT (game_name) DO NOTHING;

-- Insert default tasks
INSERT INTO tasks (title, description, category, reward, icon, cooldown_hours, max_progress) VALUES
  ('Daily Login Bonus', 'Log in to CharliesOdds every day', 'daily', 25, 'Calendar', 24, 1),
  ('Daily Wheel Spin', 'Spin the wheel once per day for free money', 'daily', 0, 'RotateCcw', 24, 1),
  ('Play 10 Games', 'Play any 10 games across the platform', 'daily', 15, 'Play', 24, 10),
  ('Dice Master', 'Win 5 dice games in a row', 'gaming', 50, 'Target', 0, 5),
  ('Crash Survivor', 'Cash out at 10x multiplier in Crash', 'gaming', 75, 'Zap', 0, 1),
  ('Blackjack Pro', 'Get 3 blackjacks in one session', 'gaming', 40, 'Trophy', 0, 3),
  ('Plinko Lucky', 'Hit a 1000x multiplier in Plinko', 'gaming', 100, 'Star', 0, 1),
  ('Complete Your Profile', 'Fill out all profile information', 'social', 20, 'Users', 0, 1),
  ('Submit a Suggestion', 'Help improve the platform with feedback', 'social', 30, 'Heart', 0, 1),
  ('First Week Milestone', 'Play for 7 consecutive days', 'special', 150, 'Trophy', 0, 7),
  ('Big Winner', 'Win $500 in a single session', 'special', 200, 'Coins', 0, 1)
ON CONFLICT (title) DO NOTHING;

-- Function to automatically create user_stats when profile is created
CREATE OR REPLACE FUNCTION create_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user_stats automatically
DROP TRIGGER IF EXISTS create_user_stats_trigger ON profiles;
CREATE TRIGGER create_user_stats_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_stats();

-- Function to update user stats when bets are placed
CREATE OR REPLACE FUNCTION update_user_stats_on_bet()
RETURNS TRIGGER AS $$
DECLARE
  profit numeric;
  is_win boolean;
BEGIN
  profit := NEW.win_amount - NEW.bet_amount;
  is_win := profit > 0;
  
  -- Update user stats
  UPDATE user_stats SET
    total_bets = total_bets + 1,
    total_wins = total_wins + CASE WHEN is_win THEN 1 ELSE 0 END,
    total_losses = total_losses + CASE WHEN is_win THEN 0 ELSE 1 END,
    total_wagered = total_wagered + NEW.bet_amount,
    total_won = total_won + NEW.win_amount,
    biggest_win = GREATEST(biggest_win, profit),
    biggest_loss = LEAST(biggest_loss, profit),
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  -- Update user balance
  UPDATE profiles SET
    balance = balance + profit,
    updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats on bet insertion
DROP TRIGGER IF EXISTS update_user_stats_on_bet_trigger ON game_bets;
CREATE TRIGGER update_user_stats_on_bet_trigger
  AFTER INSERT ON game_bets
  FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_bet();

-- Function to update suggestion vote counts
CREATE OR REPLACE FUNCTION update_suggestion_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE suggestions SET upvotes = upvotes + 1 WHERE id = NEW.suggestion_id;
    ELSE
      UPDATE suggestions SET downvotes = downvotes + 1 WHERE id = NEW.suggestion_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Remove old vote
    IF OLD.vote_type = 'up' THEN
      UPDATE suggestions SET upvotes = upvotes - 1 WHERE id = OLD.suggestion_id;
    ELSE
      UPDATE suggestions SET downvotes = downvotes - 1 WHERE id = OLD.suggestion_id;
    END IF;
    -- Add new vote
    IF NEW.vote_type = 'up' THEN
      UPDATE suggestions SET upvotes = upvotes + 1 WHERE id = NEW.suggestion_id;
    ELSE
      UPDATE suggestions SET downvotes = downvotes + 1 WHERE id = NEW.suggestion_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE suggestions SET upvotes = upvotes - 1 WHERE id = OLD.suggestion_id;
    ELSE
      UPDATE suggestions SET downvotes = downvotes - 1 WHERE id = OLD.suggestion_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vote counts
DROP TRIGGER IF EXISTS update_suggestion_votes_trigger ON suggestion_votes;
CREATE TRIGGER update_suggestion_votes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON suggestion_votes
  FOR EACH ROW EXECUTE FUNCTION update_suggestion_votes();