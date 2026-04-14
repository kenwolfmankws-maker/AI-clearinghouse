export interface ChatTag {
  id: string;
  name: string;
}

export const chatHistoryService = {
  async getTagAnalytics() {
    return [] as any[];
  },
  async getTagUsageOverTime() {
    return [] as any[];
  },
  async getTags() {
    return [] as ChatTag[];
  },
  async mergeTags(_selectedTagIds: string[], _targetTagId: string) {
    return false;
  },
  async renameTag(_tagId: string, _newName: string) {
    return false;
  },
};
