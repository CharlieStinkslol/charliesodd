/*
  # Create user statistics table

  1. New Tables
    - `user_stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `total_bets` (integer, default 0)
      - `total_wins` (integer, default 0)
      - `total_losses` (integer, default 0)
      - `total_wagered` (numeric, default 0)
      - `total_won` (numeric, default 0)
      - `biggest_win` (numeric, default 0)
      - `biggest_loss` (numeric, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_stats` table
    - Add policy for users to read/update their own stats
    - Add policy for admins to read all stats
*/

CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  total_bets integer DEFAULT 0 CHECK (total_bets >= 0),
  total_wins integer DEFAULT 0 CHECK (total_wins >= 0),
  total_losses integer DEFAULT 0 CHECK (total_losses >= 0),
  total_wagered numeric DEFAULT 0 CHECK (total_wagered >= 0),
  total_won numeric DEFAULT 0 CHECK (total_won >= 0),
  biggest_win numeric DEFAULT 0,
  biggest_loss numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own stats
CREATE POLICY "Users can read own stats"
  ON user_stats
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own stats"
  ON user_stats
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own stats"
  ON user_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can read all stats
CREATE POLICY "Admins can read all stats"
  ON user_stats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();