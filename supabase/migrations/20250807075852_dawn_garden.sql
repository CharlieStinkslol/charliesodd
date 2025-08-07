/*
  # CharliesOdds Database Schema

  1. New Tables
    - `profiles` - User profile data extending Supabase auth
      - `id` (uuid, references auth.users)
      - `username` (text, unique)
      - `balance` (numeric, default 1000)
      - `is_admin` (boolean, default false)
      - `level` (integer, default 1)
      - `experience` (integer, default 0)
      - `last_daily_bonus` (date)
      - `currency` (text, default 'USD')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_stats` - Gaming statistics for each user
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `total_bets` (integer, default 0)
      - `total_wins` (integer, default 0)
      - `total_losses` (integer, default 0)
      - `biggest_win` (numeric, default 0)
      - `biggest_loss` (numeric, default 0)
      - `total_wagered` (numeric, default 0)
      - `total_won` (numeric, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `game_bets` - Individual bet records
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `game_name` (text)
      - `bet_amount` (numeric)
      - `win_amount` (numeric)
      - `multiplier` (numeric)
      - `game_result` (jsonb)
      - `created_at` (timestamptz)
    
    - `game_settings` - Saved game configurations
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `game_name` (text)
      - `setting_name` (text)
      - `settings` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `suggestions` - Community suggestions and feedback
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `priority` (text)
      - `status` (text, default 'open')
      - `upvotes` (integer, default 0)
      - `downvotes` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `suggestion_votes` - User votes on suggestions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `suggestion_id` (uuid, references suggestions)
      - `vote_type` (text) -- 'up' or 'down'
      - `created_at` (timestamptz)
    
    - `admin_responses` - Admin responses to suggestions
      - `id` (uuid, primary key)
      - `suggestion_id` (uuid, references suggestions)
      - `admin_id` (uuid, references profiles)
      - `response_text` (text)
      - `created_at` (timestamptz)
    
    - `tasks` - Earning tasks for users
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `task_id` (text)
      - `completed` (boolean, default false)
      - `completed_at` (timestamptz)
      - `last_completed` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Admin-only policies for admin tables
    - Public read access for suggestions (with user filtering)

  3. Functions
    - Trigger to create user_stats when profile is created
    - Function to update user stats when bets are placed
    - Function to handle daily bonus claims
    - Function to calculate user levels based on experience
</sql>

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  balance numeric DEFAULT 1000 NOT NULL CHECK (balance >= 0),
  is_admin boolean DEFAULT false NOT NULL,
  level integer DEFAULT 1 NOT NULL CHECK (level >= 1),
  experience integer DEFAULT 0 NOT NULL CHECK (experience >= 0),
  last_daily_bonus date,
  currency text DEFAULT 'USD' NOT NULL CHECK (currency IN ('USD', 'GBP', 'EUR', 'BTC', 'ETH', 'LTC')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  total_bets integer DEFAULT 0 NOT NULL CHECK (total_bets >= 0),
  total_wins integer DEFAULT 0 NOT NULL CHECK (total_wins >= 0),
  total_losses integer DEFAULT 0 NOT NULL CHECK (total_losses >= 0),
  biggest_win numeric DEFAULT 0 NOT NULL,
  biggest_loss numeric DEFAULT 0 NOT NULL,
  total_wagered numeric DEFAULT 0 NOT NULL CHECK (total_wagered >= 0),
  total_won numeric DEFAULT 0 NOT NULL CHECK (total_won >= 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create game_bets table
CREATE TABLE IF NOT EXISTS game_bets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_name text NOT NULL,
  bet_amount numeric NOT NULL CHECK (bet_amount > 0),
  win_amount numeric DEFAULT 0 NOT NULL CHECK (win_amount >= 0),
  multiplier numeric DEFAULT 0 NOT NULL CHECK (multiplier >= 0),
  game_result jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create game_settings table
CREATE TABLE IF NOT EXISTS game_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_name text NOT NULL,
  setting_name text NOT NULL,
  settings jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, game_name, setting_name)
);

-- Create suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'feature' NOT NULL CHECK (category IN ('feature', 'bug', 'improvement', 'other')),
  priority text DEFAULT 'medium' NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'under-review', 'planned', 'in-progress', 'completed', 'rejected')),
  upvotes integer DEFAULT 0 NOT NULL CHECK (upvotes >= 0),
  downvotes integer DEFAULT 0 NOT NULL CHECK (downvotes >= 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create suggestion_votes table
CREATE TABLE IF NOT EXISTS suggestion_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  suggestion_id uuid REFERENCES suggestions(id) ON DELETE CASCADE NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, suggestion_id)
);

-- Create admin_responses table
CREATE TABLE IF NOT EXISTS admin_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id uuid REFERENCES suggestions(id) ON DELETE CASCADE NOT NULL,
  admin_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  response_text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  task_id text NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  last_completed timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, task_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- User stats policies
CREATE POLICY "Users can view own stats"
  ON user_stats
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own stats"
  ON user_stats
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own stats"
  ON user_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Game bets policies
CREATE POLICY "Users can view own bets"
  ON game_bets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own bets"
  ON game_bets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Game settings policies
CREATE POLICY "Users can manage own settings"
  ON game_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Suggestions policies (public read, authenticated write)
CREATE POLICY "Anyone can view suggestions"
  ON suggestions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create suggestions"
  ON suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own suggestions"
  ON suggestions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Suggestion votes policies
CREATE POLICY "Users can view all votes"
  ON suggestion_votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own votes"
  ON suggestion_votes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin responses policies
CREATE POLICY "Anyone can view admin responses"
  ON admin_responses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create responses"
  ON admin_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Tasks policies
CREATE POLICY "Users can manage own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_game_bets_user_id ON game_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_game_bets_created_at ON game_bets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_bets_game_name ON game_bets(game_name);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_suggestion_id ON suggestion_votes(suggestion_id);

-- Function to create user stats when profile is created
CREATE OR REPLACE FUNCTION create_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create user stats
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_stats();

-- Function to update user stats when bet is placed
CREATE OR REPLACE FUNCTION update_user_stats_on_bet()
RETURNS TRIGGER AS $$
DECLARE
  is_win boolean;
  profit numeric;
BEGIN
  is_win := NEW.win_amount > NEW.bet_amount;
  profit := NEW.win_amount - NEW.bet_amount;
  
  UPDATE user_stats 
  SET 
    total_bets = total_bets + 1,
    total_wins = total_wins + CASE WHEN is_win THEN 1 ELSE 0 END,
    total_losses = total_losses + CASE WHEN is_win THEN 0 ELSE 1 END,
    biggest_win = GREATEST(biggest_win, profit),
    biggest_loss = LEAST(biggest_loss, profit),
    total_wagered = total_wagered + NEW.bet_amount,
    total_won = total_won + NEW.win_amount,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats on bet insertion
DROP TRIGGER IF EXISTS on_bet_placed ON game_bets;
CREATE TRIGGER on_bet_placed
  AFTER INSERT ON game_bets
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_bet();

-- Function to update suggestion vote counts
CREATE OR REPLACE FUNCTION update_suggestion_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE suggestions 
    SET 
      upvotes = upvotes + CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE 0 END,
      downvotes = downvotes + CASE WHEN NEW.vote_type = 'down' THEN 1 ELSE 0 END,
      updated_at = now()
    WHERE id = NEW.suggestion_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE suggestions 
    SET 
      upvotes = upvotes + 
        CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE 0 END -
        CASE WHEN OLD.vote_type = 'up' THEN 1 ELSE 0 END,
      downvotes = downvotes + 
        CASE WHEN NEW.vote_type = 'down' THEN 1 ELSE 0 END -
        CASE WHEN OLD.vote_type = 'down' THEN 1 ELSE 0 END,
      updated_at = now()
    WHERE id = NEW.suggestion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE suggestions 
    SET 
      upvotes = upvotes - CASE WHEN OLD.vote_type = 'up' THEN 1 ELSE 0 END,
      downvotes = downvotes - CASE WHEN OLD.vote_type = 'down' THEN 1 ELSE 0 END,
      updated_at = now()
    WHERE id = OLD.suggestion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for suggestion votes
DROP TRIGGER IF EXISTS on_suggestion_vote_change ON suggestion_votes;
CREATE TRIGGER on_suggestion_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON suggestion_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_suggestion_votes();

-- Function to update profile updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_settings_updated_at ON game_settings;
CREATE TRIGGER update_game_settings_updated_at
  BEFORE UPDATE ON game_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suggestions_updated_at ON suggestions;
CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();