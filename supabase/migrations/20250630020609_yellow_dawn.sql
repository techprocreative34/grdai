/*
  # Create saved prompts table for user collections

  1. New Tables
    - `saved_prompts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `prompt_text` (text)
      - `type` (enum: 'image' or 'text')
      - `is_favorite` (boolean, default false)
      - `tags` (text array, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `saved_prompts` table
    - Add policies for users to manage their own prompts

  3. Indexes
    - Add indexes for better query performance
*/

-- Create enum for prompt types
DO $$ BEGIN
  CREATE TYPE prompt_type AS ENUM ('image', 'text');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create saved_prompts table
CREATE TABLE IF NOT EXISTS saved_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_text text NOT NULL,
  type prompt_type NOT NULL,
  is_favorite boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE saved_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own saved prompts"
  ON saved_prompts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved prompts"
  ON saved_prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved prompts"
  ON saved_prompts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved prompts"
  ON saved_prompts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_type ON saved_prompts(type);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_is_favorite ON saved_prompts(is_favorite);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_created_at ON saved_prompts(created_at DESC);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_saved_prompts_updated_at
  BEFORE UPDATE ON saved_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE saved_prompts IS 'User saved prompts collection with favorites and tagging';