import { supabase } from './supabase';

export interface ChatMessage {
  id?: string;
  conversation_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

export interface ChatTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  tags?: ChatTag[];
}


export const chatHistoryService = {
  async createConversation(title: string): Promise<ChatConversation | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({ user_id: user.id, title })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
    return data;
  },

  async getConversations(): Promise<ChatConversation[]> {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
    return data || [];
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    return data || [];
  },

  async saveMessage(conversationId: string, message: ChatMessage): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: message.role,
        content: message.content
      });

    if (error) {
      console.error('Error saving message:', error);
    }

    // Update conversation timestamp
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  },

  async deleteConversation(conversationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
    return true;
  },

  async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ title })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation title:', error);
      return false;
    }
    return true;
  },


  async searchConversations(query: string): Promise<ChatConversation[]> {
    if (!query.trim()) {
      return this.getConversations();
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Search in conversation titles
    const { data: titleMatches, error: titleError } = await supabase
      .from('chat_conversations')
      .select('*')
      .ilike('title', `%${query}%`)
      .order('updated_at', { ascending: false });

    if (titleError) {
      console.error('Error searching conversations:', titleError);
      return [];
    }

    // Search in message content
    const { data: messageMatches, error: messageError } = await supabase
      .from('chat_messages')
      .select('conversation_id')
      .ilike('content', `%${query}%`);

    if (messageError) {
      console.error('Error searching messages:', messageError);
      return titleMatches || [];
    }

    // Get unique conversation IDs from message matches
    const messageConvIds = [...new Set(messageMatches?.map(m => m.conversation_id) || [])];
    
    // Fetch conversations from message matches that aren't already in title matches
    const titleMatchIds = new Set(titleMatches?.map(c => c.id) || []);
    const additionalConvIds = messageConvIds.filter(id => !titleMatchIds.has(id));

    if (additionalConvIds.length === 0) {
      return titleMatches || [];
    }

    const { data: additionalConvs } = await supabase
      .from('chat_conversations')
      .select('*')
      .in('id', additionalConvIds)
      .order('updated_at', { ascending: false });

    // Combine and sort by updated_at
    const allMatches = [...(titleMatches || []), ...(additionalConvs || [])];
    return allMatches.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  },

  // Tag management functions
  async getTags(): Promise<ChatTag[]> {
    const { data, error } = await supabase
      .from('chat_tags')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
    return data || [];
  },

  async createTag(name: string, color: string): Promise<ChatTag | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('chat_tags')
      .insert({ user_id: user.id, name, color })
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      return null;
    }
    return data;
  },

  async updateTag(tagId: string, name: string, color: string): Promise<boolean> {
    const { error } = await supabase
      .from('chat_tags')
      .update({ name, color })
      .eq('id', tagId);

    if (error) {
      console.error('Error updating tag:', error);
      return false;
    }
    return true;
  },

  async deleteTag(tagId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chat_tags')
      .delete()
      .eq('id', tagId);

    if (error) {
      console.error('Error deleting tag:', error);
      return false;
    }
    return true;
  },

  async addTagToConversation(conversationId: string, tagId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chat_conversation_tags')
      .insert({ conversation_id: conversationId, tag_id: tagId });

    if (error) {
      console.error('Error adding tag to conversation:', error);
      return false;
    }
    return true;
  },

  async removeTagFromConversation(conversationId: string, tagId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chat_conversation_tags')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('tag_id', tagId);

    if (error) {
      console.error('Error removing tag from conversation:', error);
      return false;
    }
    return true;
  },

  async getConversationTags(conversationId: string): Promise<ChatTag[]> {
    const { data, error } = await supabase
      .from('chat_conversation_tags')
      .select('tag_id, chat_tags(*)')
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Error fetching conversation tags:', error);
      return [];
    }
    return data?.map((item: any) => item.chat_tags).filter(Boolean) || [];
  },

  async getConversationsWithTags(): Promise<ChatConversation[]> {
    const conversations = await this.getConversations();
    
    // Fetch tags for each conversation
    const conversationsWithTags = await Promise.all(
      conversations.map(async (conv) => {
        const tags = await this.getConversationTags(conv.id);
        return { ...conv, tags };
      })
    );

    return conversationsWithTags;
  },

  async filterConversationsByTags(tagIds: string[]): Promise<ChatConversation[]> {
    if (tagIds.length === 0) {
      return this.getConversationsWithTags();
    }

    const { data, error } = await supabase
      .from('chat_conversation_tags')
      .select('conversation_id')
      .in('tag_id', tagIds);

    if (error) {
      console.error('Error filtering by tags:', error);
      return [];
    }

    const convIds = [...new Set(data?.map(item => item.conversation_id) || [])];
    
    if (convIds.length === 0) return [];

    const { data: conversations } = await supabase
      .from('chat_conversations')
      .select('*')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    const conversationsWithTags = await Promise.all(
      (conversations || []).map(async (conv) => {
        const tags = await this.getConversationTags(conv.id);
        return { ...conv, tags };
      })
    );

    return conversationsWithTags;
  },

  // Bulk operations
  async bulkAddTagToConversations(conversationIds: string[], tagId: string): Promise<boolean> {
    const inserts = conversationIds.map(convId => ({
      conversation_id: convId,
      tag_id: tagId
    }));

    const { error } = await supabase
      .from('chat_conversation_tags')
      .insert(inserts);

    if (error) {
      console.error('Error bulk adding tags:', error);
      return false;
    }
    return true;
  },

  async bulkRemoveTagFromConversations(conversationIds: string[], tagId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chat_conversation_tags')
      .delete()
      .in('conversation_id', conversationIds)
      .eq('tag_id', tagId);

    if (error) {
      console.error('Error bulk removing tags:', error);
      return false;
    }
    return true;
  },

  async bulkDeleteConversations(conversationIds: string[]): Promise<boolean> {
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .in('id', conversationIds);

    if (error) {
      console.error('Error bulk deleting conversations:', error);
      return false;
    }
    return true;
  },

  // Tag analytics functions
  async getTagAnalytics(): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get all tags with conversation counts
    const { data: tagStats, error } = await supabase
      .from('chat_tags')
      .select(`
        id,
        name,
        color,
        created_at,
        chat_conversation_tags(conversation_id)
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching tag analytics:', error);
      return null;
    }

    return tagStats?.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      created_at: tag.created_at,
      conversationCount: tag.chat_conversation_tags?.length || 0
    })) || [];
  },

  async getTagUsageOverTime(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get tag assignments grouped by date
    const { data, error } = await supabase
      .from('chat_conversation_tags')
      .select(`
        created_at,
        tag_id,
        chat_tags!inner(name, user_id)
      `)
      .eq('chat_tags.user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tag usage over time:', error);
      return [];
    }

    return data || [];
  },

  async mergeTags(sourceTagIds: string[], targetTagId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get all conversation IDs that have any of the source tags
    const { data: convTags, error: fetchError } = await supabase
      .from('chat_conversation_tags')
      .select('conversation_id, tag_id')
      .in('tag_id', [...sourceTagIds, targetTagId]);

    if (fetchError) {
      console.error('Error fetching conversation tags:', fetchError);
      return false;
    }

    // Group by conversation_id
    const convMap = new Map<string, Set<string>>();
    convTags?.forEach(ct => {
      if (!convMap.has(ct.conversation_id)) {
        convMap.set(ct.conversation_id, new Set());
      }
      convMap.get(ct.conversation_id)!.add(ct.tag_id);
    });

    // For each conversation, if it doesn't have target tag, add it
    const toInsert = [];
    for (const [convId, tagSet] of convMap.entries()) {
      if (!tagSet.has(targetTagId) && sourceTagIds.some(id => tagSet.has(id))) {
        toInsert.push({ conversation_id: convId, tag_id: targetTagId });
      }
    }

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('chat_conversation_tags')
        .insert(toInsert);

      if (insertError) {
        console.error('Error inserting merged tags:', insertError);
        return false;
      }
    }

    // Delete source tags and their associations
    const { error: deleteError } = await supabase
      .from('chat_tags')
      .delete()
      .in('id', sourceTagIds);

    if (deleteError) {
      console.error('Error deleting source tags:', deleteError);
      return false;
    }

    return true;
  },

  async renameTag(tagId: string, newName: string): Promise<boolean> {
    const { error } = await supabase
      .from('chat_tags')
      .update({ name: newName })
      .eq('id', tagId);

    if (error) {
      console.error('Error renaming tag:', error);
      return false;
    }
    return true;
  },

  async bulkRenameTags(updates: { tagId: string; newName: string }[]): Promise<boolean> {
    try {
      await Promise.all(
        updates.map(({ tagId, newName }) => this.renameTag(tagId, newName))
      );
      return true;
    } catch (error) {
      console.error('Error bulk renaming tags:', error);
      return false;
    }
  }



};

