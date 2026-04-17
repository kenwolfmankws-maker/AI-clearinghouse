export interface ExportFilters {
  keyNames?: string[];
  components?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  minCost?: number;
  maxCost?: number;
}

export const APIAnalyticsExporter = {
  filterRecords: (records: any[], filters: ExportFilters) => {
    return records.filter(record => {
      if (filters.keyNames && filters.keyNames.length > 0) {
        if (!filters.keyNames.includes(record.keyName)) return false;
      }

      if (filters.components && filters.components.length > 0) {
        const recordComponents = Object.keys(record.componentUsage || {});
        if (!filters.components.some(c => recordComponents.includes(c))) return false;
      }

      if (filters.dateRange) {
        const recordDate = new Date(record.lastAccessed);
        const start = new Date(filters.dateRange.start);
        const end = new Date(filters.dateRange.end);
        if (recordDate < start || recordDate > end) return false;
      }

      if (filters.minCost !== undefined && record.estimatedCost < filters.minCost) {
        return false;
      }

      if (filters.maxCost !== undefined && record.estimatedCost > filters.maxCost) {
        return false;
      }

      return true;
    });
  }
};
