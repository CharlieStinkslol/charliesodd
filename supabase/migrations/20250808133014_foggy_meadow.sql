/*
  # Create register_user function

  1. New Functions
    - `register_user(password_input, username_input)` - Handles user registration
      - Creates a new user in auth.users
      - Creates corresponding profile in users table
      - Creates initial user_stats record
      - Returns success status and user_id

  2. Security
    - Function is accessible to anonymous users for registration
    - Uses secure password hashing via auth.users
    - Validates username uniqueness
*/

CREATE OR REPLACE FUNCTION public.register_user(
  password_input text,
  username_input text
)
RETURNS TABLE(
  success boolean,
  message text,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  existing_user_count integer;
BEGIN
  -- Check if username already exists
  SELECT COUNT(*) INTO existing_user_count
  FROM public.users
  WHERE username = username_input;
  
  IF existing_user_count > 0 THEN
    RETURN QUERY SELECT false, 'Username already exists'::text, null::uuid;
    RETURN;
  END IF;
  
  -- Create user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    username_input || '@demo.local',
    crypt(password_input, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;
  
  -- Create profile in users table
  INSERT INTO public.users (
    id,
    username,
    email,
    balance,
    is_admin,
    level,
    experience,
    last_daily_bonus,
    currency,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    username_input,
    username_input || '@demo.local',
    1000,
    false,
    1,
    0,
    null,
    'USD',
    now(),
    now()
  );
  
  -- Create initial user stats
  INSERT INTO public.user_stats (
    user_id,
    total_bets,
    total_wins,
    total_losses,
    total_wagered,
    total_won,
    biggest_win,
    biggest_loss,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    now(),
    now()
  );
  
  RETURN QUERY SELECT true, 'User registered successfully'::text, new_user_id;
END;
$$;