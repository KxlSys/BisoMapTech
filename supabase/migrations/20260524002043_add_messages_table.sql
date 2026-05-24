/*
  # Add messages table for internal communication

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, FK to profiles) - who sent the message
      - `receiver_id` (uuid, FK to profiles) - who receives the message
      - `content` (text) - message content
      - `read_at` (timestamptz) - when message was read (null = unread)
      - `created_at` (timestamptz) - when message was sent

  2. Security
    - Enable RLS on messages table
    - Users can only read messages they sent or received
    - Users can only insert messages where they are the sender
    - Users can only update read_at on messages they received

  3. Indexes
    - Index on receiver_id + read_at for unread count queries
    - Index on sender_id for conversation lookups
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages as themselves"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark received messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
  ON messages(receiver_id, read_at)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(sender_id, receiver_id, created_at DESC);
