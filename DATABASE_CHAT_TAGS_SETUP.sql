-- Chat Tagging System Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create tags table
CREATE TABLE IF NOT EXISTS chat_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create conversation_tags junction table
CREATE TABLE IF NOT EXISTS chat_conversation_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES chat_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, tag_id)
);

-- Enable RLS
ALTER TABLE chat_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversation_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_tags
CREATE POLICY "Users can view their own tags"
  ON chat_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
  ON chat_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON chat_tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON chat_tags FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for chat_conversation_tags
CREATE POLICY "Users can view tags on their conversations"
  ON chat_conversation_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add tags to their conversations"
  ON chat_conversation_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tags from their conversations"
  ON chat_conversation_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_tags_user_id ON chat_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_tags_conversation_id ON chat_conversation_tags(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_tags_tag_id ON chat_conversation_tags(tag_id);
