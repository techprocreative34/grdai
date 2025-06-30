/*
  # Add INSERT policy for profiles table

  1. Security Changes
    - Add policy for users to insert their own profile
    - This allows the API to create profiles for new users

  2. Notes
    - The existing trigger should handle profile creation automatically
    - This policy is a backup for cases where manual profile creation is needed
*/

-- Add policy for users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);