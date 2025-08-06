/*
  # Create bets table for game history

  1. New Tables
    - `bets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `game` (text, game name)
      - `bet_amount` (numeric, bet amount)
      - `win_amount` (numeric, amount won)
      - `multiplier` (numeric, multiplier achieved)
      - `result` (jsonb, game-specific result data)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `bets` table
    - Add policy for users to read their own bets
    - Add policy for users to insert their own bets
    - Add policy for admins to read all bets

  3. Indexes
    - Index on user_id for fast user bet queries
    - Index on game for game-specific queries
    - Index on created_at for chronological queries
*/

CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  game text NOT NULL CHECK (game IN ('Dice', 'Limbo', 'Crash', 'Blackjack', 'Plinko', 'Spin Wheel')),
  bet_amount numeric NOT NULL CHECK (bet_amount > 0),
  win_amount numeric DEFAULT 0 CHECK (win_amount >= 0),
  multiplier numeric DEFAULT 0 CHECK (multiplier >= 0),
  result jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

-- Users can read their own bets
CREATE POLICY "Users can read own bets"
  ON bets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own bets
CREATE POLICY "Users can insert own bets"
  ON bets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can read all bets
CREATE POLICY "Admins can read all bets"
  ON bets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_game ON bets(game);
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON bets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bets_user_game ON bets(user_id, game);