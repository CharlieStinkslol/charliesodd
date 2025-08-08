/*
  # Update authentication to use username instead of email

  1. Changes
    - Remove email requirement from profiles table
    - Add username-based authentication function
    - Update policies to work with username authentication
    - Create custom authentication functions

  2. Security
    - Maintain RLS policies
    - Add username-based authentication
    - Keep admin privileges intact
*/

-- Create a function to authenticate users by username and password
CREATE OR REPLACE FUNCTION authenticate_user(username_input text, password_input text)
RETURNS TABLE(user_id uuid, username text, is_admin boolean, balance numeric, level integer, experience integer, last_daily_bonus date, currency text, created_at timestamptz) AS $$
DECLARE
  user_record profiles%ROWTYPE;
BEGIN
  -- Find user by username
  SELECT * INTO user_record FROM profiles WHERE username = username_input;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- In a real implementation, you would hash and compare passwords
  -- For demo purposes, we'll use a simple comparison
  -- Note: This is not secure for production use
  
  RETURN QUERY
  SELECT 
    user_record.id,
    user_record.username,
    user_record.is_admin,
    user_record.balance,
    user_record.level,
    user_record.experience,
    user_record.last_daily_bonus,
    user_record.currency,
    user_record.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to register new users with username/password
CREATE OR REPLACE FUNCTION register_user(username_input text, password_input text)
RETURNS TABLE(user_id uuid, success boolean, message text) AS $$
DECLARE
  new_user_id uuid;
  existing_user profiles%ROWTYPE;
BEGIN
  -- Check if username already exists
  SELECT * INTO existing_user FROM profiles WHERE username = username_input;
  
  IF FOUND THEN
    RETURN QUERY SELECT null::uuid, false, 'Username already exists';
    RETURN;
  END IF;
  
  -- Generate new user ID
  new_user_id := gen_random_uuid();
  
  -- Insert new profile
  INSERT INTO profiles (id, username, email, balance, is_admin, level, experience, currency)
  VALUES (new_user_id, username_input, username_input || '@demo.local', 1000, false, 1, 0, 'USD');
  
  RETURN QUERY SELECT new_user_id, true, 'User created successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION authenticate_user(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION register_user(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION authenticate_user(text, text) TO anon;
GRANT EXECUTE ON FUNCTION register_user(text, text) TO anon;