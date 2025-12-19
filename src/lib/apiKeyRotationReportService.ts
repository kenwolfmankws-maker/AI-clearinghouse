import { supabase } from './supabase';

export interface ReportSchedule {
  id?: string;
  organization_id?: string;
  report_name: string;
  schedule_frequency: 'daily' | 'weekly' | 'monthly';
  report_format: 'pdf' | 'csv' | 'both';
  recipient_emails: string[];
  compliance_threshold: number;
  expiration_warning_days: number;
  include_policy_violations: boolean;
  include_rotation_history: boolean;
  include_compliance_trends: boolean;
  enabled: boolean;
  last_sent_at?: string;
  next_scheduled_at?: string;
}

export interface ComplianceMetrics {
  totalKeys: number;
  keysWithRotation: number;
  complianceRate: number;
  expiringKeys: number;
  policyViolations: number;
  totalRotations: number;
}

export async function generateComplianceReport(organizationId: string, warningDays: number = 7): Promise<ComplianceMetrics> {
  const { data: policies, error } = await supabase
    .from('api_key_rotation_policies')
    .select('*')
    .eq('organization_id', organizationId);

  if (error) throw error;

  const totalKeys = policies?.length || 0;
  const keysWithRotation = policies?.filter(p => p.auto_rotate_enabled).length || 0;
  const complianceRate = totalKeys > 0 ? (keysWithRotation / totalKeys) * 100 : 0;

  const now = new Date();
  const expiringKeys = policies?.filter(p => {
    if (!p.next_rotation_at) return false;
    const daysUntil = (new Date(p.next_rotation_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntil <= warningDays && daysUntil >= 0;
  }).length || 0;

  const policyViolations = policies?.filter(p => !p.auto_rotate_enabled || !p.rotation_interval_days).length || 0;

  return {
    totalKeys,
    keysWithRotation,
    complianceRate,
    expiringKeys,
    policyViolations,
    totalRotations: keysWithRotation
  };
}

export function generateCSVReport(policies: any[]): string {
  let csv = "API Key,Rotation Enabled,Interval (days),Last Rotation,Next Rotation,Status\n";
  
  policies.forEach(p => {
    const status = (!p.auto_rotate_enabled || !p.rotation_interval_days) ? 'Non-Compliant' : 'Compliant';
    csv += `"${p.api_key_name}",${p.auto_rotate_enabled},${p.rotation_interval_days || 'N/A'},${p.last_rotation_at || 'Never'},${p.next_rotation_at || 'N/A'},${status}\n`;
  });

  return csv;
}

export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function createReportSchedule(schedule: ReportSchedule) {
  const { data, error } = await supabase
    .from('api_key_rotation_report_schedules')
    .insert([schedule])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateReportSchedule(id: string, updates: Partial<ReportSchedule>) {
  const { data, error } = await supabase
    .from('api_key_rotation_report_schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReportSchedule(id: string) {
  const { error } = await supabase
    .from('api_key_rotation_report_schedules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getReportSchedules(organizationId: string) {
  const { data, error } = await supabase
    .from('api_key_rotation_report_schedules')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getReportHistory(organizationId: string) {
  const { data, error } = await supabase
    .from('api_key_rotation_report_history')
    .select('*')
    .eq('organization_id', organizationId)
    .order('sent_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}
