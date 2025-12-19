import { supabase } from './supabase';

export interface WebhookAnalyticsFilters {
  startDate: string;
  endDate: string;
  webhookType?: string;
  status?: string;
  endpoint?: string;
}

export const exportWebhookAnalytics = async (
  filters: WebhookAnalyticsFilters,
  format: 'csv' | 'json'
) => {
  const { data, error } = await supabase.rpc('get_webhook_analytics', {
    start_date: filters.startDate,
    end_date: filters.endDate,
    webhook_type_filter: filters.webhookType || null,
    status_filter: filters.status || null,
    endpoint_filter: filters.endpoint || null,
  });

  if (error) throw error;

  if (format === 'csv') {
    return generateCSV(data);
  } else {
    return generateJSON(data);
  }
};

const generateCSV = (data: any[]) => {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',')
  );

  return [headers, ...rows].join('\n');
};

const generateJSON = (data: any[]) => {
  return JSON.stringify(data, null, 2);
};

export const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
