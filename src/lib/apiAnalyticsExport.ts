import { APIUsageRecord } from './apiUsageTracker';

export interface ExportFilters {
  startDate?: Date;
  endDate?: Date;
  apiKeys?: string[];
  components?: string[];
}

export interface UsageReportData {
  summary: {
    totalCalls: number;
    totalCost: number;
    dateRange: string;
    generatedAt: string;
  };
  keyStats: Array<{
    keyName: string;
    calls: number;
    cost: number;
    lastUsed: string;
    rateLimitViolations: number;
  }>;
  componentStats: Array<{
    component: string;
    calls: number;
    keys: string[];
  }>;
  trends: Array<{
    date: string;
    calls: number;
    cost: number;
  }>;
}

export class APIAnalyticsExporter {
  static filterRecords(records: APIUsageRecord[], filters: ExportFilters): APIUsageRecord[] {
    return records.filter(record => {
      if (filters.apiKeys && filters.apiKeys.length > 0) {
        if (!filters.apiKeys.includes(record.keyName)) return false;
      }

      if (filters.startDate || filters.endDate) {
        const lastAccessed = new Date(record.lastAccessed);
        if (filters.startDate && lastAccessed < filters.startDate) return false;
        if (filters.endDate && lastAccessed > filters.endDate) return false;
      }

      if (filters.components && filters.components.length > 0) {
        const recordComponents = Object.keys(record.componentUsage);
        if (!recordComponents.some(c => filters.components!.includes(c))) return false;
      }

      return true;
    });
  }

  static generateReportData(records: APIUsageRecord[], filters: ExportFilters): UsageReportData {
    const filtered = this.filterRecords(records, filters);
    
    const totalCalls = filtered.reduce((sum, r) => sum + r.accessCount, 0);
    const totalCost = filtered.reduce((sum, r) => sum + r.estimatedCost, 0);

    const componentMap = new Map<string, { calls: number; keys: Set<string> }>();
    filtered.forEach(record => {
      Object.entries(record.componentUsage).forEach(([comp, calls]) => {
        if (!componentMap.has(comp)) {
          componentMap.set(comp, { calls: 0, keys: new Set() });
        }
        const entry = componentMap.get(comp)!;
        entry.calls += calls;
        entry.keys.add(record.keyName);
      });
    });

    return {
      summary: {
        totalCalls,
        totalCost,
        dateRange: filters.startDate && filters.endDate 
          ? `${filters.startDate.toLocaleDateString()} - ${filters.endDate.toLocaleDateString()}`
          : 'All time',
        generatedAt: new Date().toISOString(),
      },
      keyStats: filtered.map(r => ({
        keyName: r.keyName,
        calls: r.accessCount,
        cost: r.estimatedCost,
        lastUsed: r.lastAccessed,
        rateLimitViolations: r.rateLimit && r.accessCount > r.rateLimit ? 1 : 0,
      })),
      componentStats: Array.from(componentMap.entries()).map(([comp, data]) => ({
        component: comp,
        calls: data.calls,
        keys: Array.from(data.keys),
      })),
      trends: [],
    };
  }

  static exportToCSV(data: UsageReportData): string {
    let csv = 'API Usage Analytics Report\n\n';
    csv += `Generated: ${new Date(data.summary.generatedAt).toLocaleString()}\n`;
    csv += `Date Range: ${data.summary.dateRange}\n`;
    csv += `Total Calls: ${data.summary.totalCalls}\n`;
    csv += `Total Cost: $${data.summary.totalCost.toFixed(4)}\n\n`;

    csv += 'API Key Statistics\n';
    csv += 'Key Name,Calls,Cost ($),Last Used,Rate Limit Violations\n';
    data.keyStats.forEach(stat => {
      csv += `${stat.keyName},${stat.calls},${stat.cost.toFixed(4)},${new Date(stat.lastUsed).toLocaleString()},${stat.rateLimitViolations}\n`;
    });

    csv += '\nComponent Usage\n';
    csv += 'Component,Calls,API Keys Used\n';
    data.componentStats.forEach(stat => {
      csv += `${stat.component},${stat.calls},"${stat.keys.join(', ')}"\n`;
    });

    return csv;
  }

  static downloadCSV(data: UsageReportData, filename: string = 'api-usage-report.csv') {
    const csv = this.exportToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  static exportToPDF(data: UsageReportData): string {
    return JSON.stringify(data, null, 2);
  }
}
