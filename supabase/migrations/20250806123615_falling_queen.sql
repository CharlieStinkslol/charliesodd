/*
  # Create tasks and achievements system

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text, task title)
      - `description` (text, task description)
      - `category` (text, task category)
      - `reward` (numeric, reward amount)
      - `icon` (text, icon name)
      - `cooldown_hours` (integer, cooldown in hours)
      - `max_progress` (integer, max progress needed)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)

    - `user_task_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `task_id` (uuid, foreign key to tasks)
      - `progress` (integer, current progress)
      - `completed` (boolean, default false)
      - `last_completed` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add appropriate policies
*/

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

CREATE TABLE IF NOT EXISTS user_task_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  progress integer DEFAULT 0 CHECK (progress >= 0),
  completed boolean DEFAULT false,
  last_completed timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_progress ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Anyone can read active tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can manage tasks
CREATE POLICY "Admins can manage tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- User task progress policies
CREATE POLICY "Users can read own task progress"
  ON user_task_progress
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own task progress"
  ON user_task_progress
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can read all task progress
CREATE POLICY "Admins can read all task progress"
  ON user_task_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Trigger
CREATE TRIGGER update_user_task_progress_updated_at
  BEFORE UPDATE ON user_task_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_user_task_progress_user_id ON user_task_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_progress_task_id ON user_task_progress(task_id);

-- Insert default tasks
INSERT INTO tasks (title, description, category, reward, icon, cooldown_hours, max_progress) VALUES
  ('Daily Login Bonus', 'Log in to CharliesOdds every day', 'daily', 25, 'Calendar', 24, 1),
  ('Daily Wheel Spin', 'Spin the wheel once per day for free money', 'daily', 0, 'RotateCcw', 24, 1),
  ('Play 10 Games', 'Play any 10 games across the platform', 'daily', 15, 'Play', 24, 10),
  ('Dice Master', 'Win 5 dice games in a row', 'gaming', 50, 'Target', 0, 5),
  ('Crash Survivor', 'Cash out at 10x multiplier in Crash', 'gaming', 75, 'Zap', 0, 1),
  ('Blackjack Pro', 'Get 3 blackjacks in one session', 'gaming', 40, 'Trophy', 0, 3),
  ('Plinko Lucky', 'Hit a 1000x multiplier in Plinko', 'gaming', 100, 'Star', 0, 1),
  ('Limbo High Roller', 'Win with a 50x target multiplier', 'gaming', 80, 'Award', 0, 1),
  ('Complete Your Profile', 'Fill out all profile information', 'social', 20, 'Users', 0, 1),
  ('Submit a Suggestion', 'Help improve the platform with feedback', 'social', 30, 'Heart', 0, 1),
  ('First Week Milestone', 'Play for 7 consecutive days', 'special', 150, 'Trophy', 0, 7),
  ('Big Winner', 'Win $500 in a single session', 'special', 200, 'Coins', 0, 1)
ON CONFLICT DO NOTHING;