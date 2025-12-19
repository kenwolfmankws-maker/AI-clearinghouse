import { APIAlertService } from './apiAlertService';

export interface APIUsageRecord {

  keyName: string;
  accessCount: number;
  lastAccessed: string;
  componentUsage: Record<string, number>;
  estimatedCost: number;
  rateLimit?: number;
  rateLimitWindow?: string;
  currentUsage?: number;
  callHistory: APICallRecord[];
  rateLimitViolations: number;
}

export interface APICallRecord {
  timestamp: string;
  componentName: string;
  cost: number;
  rateLimitViolation?: boolean;
}


export interface APIKeyConfig {
  name: string;
  costPerCall?: number;
  rateLimit?: number;
  rateLimitWindow?: string;
  monthlyQuota?: number;
}

const STORAGE_KEY = 'api_usage_tracking';
const API_CONFIGS: Record<string, APIKeyConfig> = {
  OPENAI_API_KEY: { name: 'OpenAI', costPerCall: 0.002, rateLimit: 60, rateLimitWindow: 'minute', monthlyQuota: 10000 },
  VITE_RESEND_API_KEY: { name: 'Resend', costPerCall: 0.001, rateLimit: 100, rateLimitWindow: 'hour' },
  TWILIO_AUTH_TOKEN: { name: 'Twilio', costPerCall: 0.0075, rateLimit: 1000, rateLimitWindow: 'hour' },
};

export class APIUsageTracker {
  private static getUsageData(): Record<string, APIUsageRecord> {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  private static saveUsageData(data: Record<string, APIUsageRecord>) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  static trackAccess(keyName: string, componentName: string = 'Unknown') {
    const usage = this.getUsageData();
    const config = API_CONFIGS[keyName] || {};
    const timestamp = new Date().toISOString();
    const cost = config.costPerCall || 0;
    
    if (!usage[keyName]) {
      usage[keyName] = {
        keyName,
        accessCount: 0,
        lastAccessed: timestamp,
        componentUsage: {},
        estimatedCost: 0,
        rateLimit: config.rateLimit,
        rateLimitWindow: config.rateLimitWindow,
        currentUsage: 0,
        callHistory: [],
        rateLimitViolations: 0,
      };
    }

    // Check for rate limit violation
    const isViolation = this.checkRateLimitViolation(keyName, usage[keyName]);
    
    usage[keyName].accessCount++;
    usage[keyName].lastAccessed = timestamp;
    usage[keyName].componentUsage[componentName] = (usage[keyName].componentUsage[componentName] || 0) + 1;
    usage[keyName].estimatedCost += cost;
    
    // Add to call history
    usage[keyName].callHistory.push({
      timestamp,
      componentName,
      cost,
      rateLimitViolation: isViolation,
    });

    if (isViolation) {
      usage[keyName].rateLimitViolations++;
    }

    // Keep only last 1000 calls to prevent storage bloat
    if (usage[keyName].callHistory.length > 1000) {
      usage[keyName].callHistory = usage[keyName].callHistory.slice(-1000);
    }

    this.saveUsageData(usage);
    this.checkAlerts(keyName, usage[keyName]);
  }


  static getUsageStats(): APIUsageRecord[] {
    const usage = this.getUsageData();
    return Object.values(usage).sort((a, b) => b.accessCount - a.accessCount);
  }

  static getKeyUsage(keyName: string): APIUsageRecord | null {
    const usage = this.getUsageData();
    return usage[keyName] || null;
  }

  static resetUsage(keyName?: string) {
    if (keyName) {
      const usage = this.getUsageData();
      delete usage[keyName];
      this.saveUsageData(usage);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  private static checkRateLimitViolation(keyName: string, record: APIUsageRecord): boolean {
    const config = API_CONFIGS[keyName];
    if (!config?.rateLimit || !config?.rateLimitWindow) return false;

    const now = new Date();
    const windowMs = this.getWindowMilliseconds(config.rateLimitWindow);
    const windowStart = new Date(now.getTime() - windowMs);

    const recentCalls = record.callHistory.filter(
      call => new Date(call.timestamp) > windowStart
    ).length;

    return recentCalls >= config.rateLimit;
  }

  private static getWindowMilliseconds(window: string): number {
    const windows: Record<string, number> = {
      'minute': 60 * 1000,
      'hour': 60 * 60 * 1000,
      'day': 24 * 60 * 60 * 1000,
    };
    return windows[window] || 60 * 1000;
  }

  private static checkAlerts(keyName: string, record: APIUsageRecord) {
    APIAlertService.checkAlerts(keyName, record);
  }


  static getAggregatedData(records: APIUsageRecord[], period: 'daily' | 'weekly' | 'monthly') {
    const allCalls = records.flatMap(r => r.callHistory);
    const grouped: Record<string, { calls: number; cost: number; violations: number }> = {};

    allCalls.forEach(call => {
      const date = new Date(call.timestamp);
      let key: string;

      if (period === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = { calls: 0, cost: 0, violations: 0 };
      }

      grouped[key].calls++;
      grouped[key].cost += call.cost;
      if (call.rateLimitViolation) {
        grouped[key].violations++;
      }
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

