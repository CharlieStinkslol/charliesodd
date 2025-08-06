/*
  # Create game settings and admin configuration tables

  1. New Tables
    - `game_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `game_name` (text, game name)
      - `setting_name` (text, setting configuration name)
      - `settings` (jsonb, setting configuration)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `admin_game_config`
      - `id` (uuid, primary key)
      - `game_name` (text, game name)
      - `enabled` (boolean, default true)
      - `min_bet` (numeric, default 0.01)
      - `max_bet` (numeric, default 1000)
      - `house_edge` (numeric, default 1)
      - `updated_by` (uuid, foreign key to users)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add appropriate policies for users and admins
*/

CREATE TABLE IF NOT EXISTS game_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  game_name text NOT NULL,
  setting_name text NOT NULL,
  settings jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, game_name, setting_name)
);

CREATE TABLE IF NOT EXISTS admin_game_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_name text UNIQUE NOT NULL CHECK (game_name IN ('dice', 'limbo', 'crash', 'blackjack', 'plinko', 'spin-wheel')),
  enabled boolean DEFAULT true,
  min_bet numeric DEFAULT 0.01 CHECK (min_bet > 0),
  max_bet numeric DEFAULT 1000 CHECK (max_bet >= min_bet),
  house_edge numeric DEFAULT 1 CHECK (house_edge >= 0 AND house_edge <= 100),
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_game_config ENABLE ROW LEVEL SECURITY;

-- Game settings policies
CREATE POLICY "Users can read own game settings"
  ON game_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own game settings"
  ON game_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin game config policies
CREATE POLICY "Anyone can read game config"
  ON admin_game_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage game config"
  ON admin_game_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Triggers
CREATE TRIGGER update_game_settings_updated_at
  BEFORE UPDATE ON game_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_game_config_updated_at
  BEFORE UPDATE ON admin_game_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_settings_user_id ON game_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_game_settings_game_name ON game_settings(game_name);

-- Insert default game configurations
INSERT INTO admin_game_config (game_name, enabled, min_bet, max_bet, house_edge) VALUES
  ('dice', true, 0.01, 1000, 1),
  ('limbo', true, 0.01, 1000, 1),
  ('crash', true, 0.01, 1000, 1),
  ('blackjack', true, 0.01, 1000, 0.5),
  ('plinko', true, 0.01, 1000, 2),
  ('spin-wheel', true, 0.01, 1000, 5)
ON CONFLICT (game_name) DO NOTHING;