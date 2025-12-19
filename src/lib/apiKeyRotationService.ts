export interface RotationPolicy {
  id?: string;
  keyName: string;
  rotationEnabled: boolean;
  rotationIntervalDays: number;
  gracePeriodDays: number;
  autoRotate: boolean;
  notifyBeforeDays: number;
  lastRotationDate?: Date;
  nextRotationDate?: Date;
}

export interface KeyHistoryEntry {
  id: string;
  keyName: string;
  keyHash: string;
  rotatedAt: Date;
  expiresAt?: Date;
  rotationReason: string;
  rotatedBy: string;
  isActive: boolean;
}

export interface RotationAuditEntry {
  id: string;
  keyName: string;
  action: string;
  oldKeyHash?: string;
  newKeyHash?: string;
  rotationType: string;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

class APIKeyRotationService {
  private storageKey = 'api_key_rotation_policies';
  private historyKey = 'api_key_history';
  private auditKey = 'api_key_rotation_audit';

  async getRotationPolicy(keyName: string): Promise<RotationPolicy | null> {
    const policies = this.loadPolicies();
    return policies.find(p => p.keyName === keyName) || null;
  }

  async saveRotationPolicy(policy: RotationPolicy): Promise<void> {
    const policies = this.loadPolicies();
    const index = policies.findIndex(p => p.keyName === policy.keyName);
    if (index >= 0) policies[index] = policy;
    else policies.push(policy);
    localStorage.setItem(this.storageKey, JSON.stringify(policies));
    await this.logAudit(policy.keyName, 'policy_updated', '', '', 'manual', true);
  }

  async rotateKey(keyName: string, reason: string, type: 'manual' | 'automatic'): Promise<string> {
    const newKey = this.generateApiKey();
    const policy = await this.getRotationPolicy(keyName);
    await this.addToHistory(keyName, newKey, reason, type);
    if (policy) {
      policy.lastRotationDate = new Date();
      policy.nextRotationDate = new Date(Date.now() + policy.rotationIntervalDays * 24 * 60 * 60 * 1000);
      await this.saveRotationPolicy(policy);
    }
    await this.logAudit(keyName, 'key_rotated', '', newKey, type, true);
    return newKey;
  }

  private generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'sk_';
    for (let i = 0; i < 48; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    return key;
  }

  private loadPolicies(): RotationPolicy[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  async getKeyHistory(keyName: string): Promise<KeyHistoryEntry[]> {
    const data = localStorage.getItem(this.historyKey);
    const history: KeyHistoryEntry[] = data ? JSON.parse(data) : [];
    return history.filter(h => h.keyName === keyName);
  }

  private async addToHistory(keyName: string, keyHash: string, reason: string, rotatedBy: string): Promise<void> {
    const data = localStorage.getItem(this.historyKey);
    const history: KeyHistoryEntry[] = data ? JSON.parse(data) : [];
    history.push({ id: crypto.randomUUID(), keyName, keyHash, rotatedAt: new Date(), rotationReason: reason, rotatedBy, isActive: true });
    localStorage.setItem(this.historyKey, JSON.stringify(history));
  }

  private async logAudit(keyName: string, action: string, oldKey: string, newKey: string, type: string, success: boolean): Promise<void> {
    const data = localStorage.getItem(this.auditKey);
    const audit: RotationAuditEntry[] = data ? JSON.parse(data) : [];
    audit.push({ id: crypto.randomUUID(), keyName, action, oldKeyHash: oldKey, newKeyHash: newKey, rotationType: type, success, createdAt: new Date() });
    localStorage.setItem(this.auditKey, JSON.stringify(audit.slice(-100)));
  }

  async getAuditLog(keyName?: string): Promise<RotationAuditEntry[]> {
    const data = localStorage.getItem(this.auditKey);
    const audit: RotationAuditEntry[] = data ? JSON.parse(data) : [];
    return keyName ? audit.filter(a => a.keyName === keyName) : audit;
  }

  async checkExpiringKeys(): Promise<Array<{ keyName: string; daysUntilExpiry: number }>> {
    const policies = this.loadPolicies();
    const expiring: Array<{ keyName: string; daysUntilExpiry: number }> = [];
    for (const policy of policies) {
      if (policy.rotationEnabled && policy.nextRotationDate) {
        const daysUntil = Math.floor((new Date(policy.nextRotationDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        if (daysUntil <= policy.notifyBeforeDays) {
          expiring.push({ keyName: policy.keyName, daysUntilExpiry: daysUntil });
          const { APIAlertService } = await import('./apiAlertService');
          APIAlertService.sendKeyExpiryAlert(policy.keyName, daysUntil);
        }
      }
    }
    return expiring;
  }
}

export const apiKeyRotationService = new APIKeyRotationService();
