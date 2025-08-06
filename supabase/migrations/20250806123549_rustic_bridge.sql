/*
  # Create suggestions table for community feedback

  1. New Tables
    - `suggestions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text, suggestion title)
      - `description` (text, suggestion description)
      - `category` (text, suggestion category)
      - `priority` (text, priority level)
      - `status` (text, current status)
      - `upvotes` (integer, default 0)
      - `downvotes` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `suggestion_votes`
      - `id` (uuid, primary key)
      - `suggestion_id` (uuid, foreign key to suggestions)
      - `user_id` (uuid, foreign key to users)
      - `vote_type` (text, 'up' or 'down')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add appropriate policies for reading and voting
*/

CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
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

CREATE TABLE IF NOT EXISTS suggestion_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid REFERENCES suggestions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(suggestion_id, user_id)
);

-- Enable RLS
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_votes ENABLE ROW LEVEL SECURITY;

-- Suggestions policies
CREATE POLICY "Anyone can read suggestions"
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
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can update any suggestion
CREATE POLICY "Admins can update suggestions"
  ON suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Suggestion votes policies
CREATE POLICY "Users can read votes"
  ON suggestion_votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can vote"
  ON suggestion_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own votes"
  ON suggestion_votes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own votes"
  ON suggestion_votes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Triggers
CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_category ON suggestions(category);
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_suggestion_id ON suggestion_votes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_user_id ON suggestion_votes(user_id);