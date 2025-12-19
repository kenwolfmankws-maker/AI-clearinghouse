import * as XLSX from 'xlsx';

interface TemplateAnalytics {
  template_id: string;
  template_name: string;
  category: string;
  times_used: number;
  acceptances: number;
  acceptance_rate: number;
  avg_time_to_accept_hours: number;
  last_used_at: string;
}

interface CategoryStats {
  category: string;
  total_uses: number;
  avg_acceptance_rate: number;
}

export function exportToCSV(
  analytics: TemplateAnalytics[],
  categoryStats: CategoryStats[],
  dateRange: { from?: Date; to?: Date }
) {
  const rows = [
    ['Template Analytics Report'],
    [`Generated: ${new Date().toLocaleString()}`],
    dateRange.from ? [`Date Range: ${dateRange.from.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString() || 'Present'}`] : [],
    [],
    ['Template Performance'],
    ['Template Name', 'Category', 'Times Used', 'Acceptances', 'Acceptance Rate (%)', 'Avg Time to Accept (hours)', 'Last Used'],
    ...analytics.map(t => [
      t.template_name,
      t.category,
      t.times_used,
      t.acceptances,
      t.acceptance_rate.toFixed(2),
      t.avg_time_to_accept_hours.toFixed(2),
      t.last_used_at ? new Date(t.last_used_at).toLocaleDateString() : 'Never'
    ]),
    [],
    ['Category Performance'],
    ['Category', 'Total Uses', 'Avg Acceptance Rate (%)'],
    ...categoryStats.map(c => [
      c.category,
      c.total_uses,
      c.avg_acceptance_rate.toFixed(2)
    ])
  ];

  const csv = rows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `template-analytics-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel(
  analytics: TemplateAnalytics[],
  categoryStats: CategoryStats[],
  dateRange: { from?: Date; to?: Date }
) {
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Template Analytics Report'],
    [`Generated: ${new Date().toLocaleString()}`],
    dateRange.from ? [`Date Range: ${dateRange.from.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString() || 'Present'}`] : [],
    [],
    ['Summary Metrics'],
    ['Total Invitations', analytics.reduce((sum, t) => sum + t.times_used, 0)],
    ['Total Acceptances', analytics.reduce((sum, t) => sum + t.acceptances, 0)],
    ['Overall Acceptance Rate (%)', ((analytics.reduce((sum, t) => sum + t.acceptances, 0) / analytics.reduce((sum, t) => sum + t.times_used, 0)) * 100).toFixed(2)],
    ['Active Templates', analytics.length],
    ['Categories', categoryStats.length]
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Template Performance Sheet
  const templateData = [
    ['Template Name', 'Category', 'Times Used', 'Acceptances', 'Acceptance Rate (%)', 'Avg Time to Accept (hours)', 'Last Used'],
    ...analytics.map(t => [
      t.template_name,
      t.category,
      t.times_used,
      t.acceptances,
      parseFloat(t.acceptance_rate.toFixed(2)),
      parseFloat(t.avg_time_to_accept_hours.toFixed(2)),
      t.last_used_at ? new Date(t.last_used_at).toLocaleDateString() : 'Never'
    ])
  ];
  const templateWs = XLSX.utils.aoa_to_sheet(templateData);
  XLSX.utils.book_append_sheet(wb, templateWs, 'Template Performance');

  // Category Performance Sheet
  const categoryData = [
    ['Category', 'Total Uses', 'Avg Acceptance Rate (%)'],
    ...categoryStats.map(c => [
      c.category,
      c.total_uses,
      parseFloat(c.avg_acceptance_rate.toFixed(2))
    ])
  ];
  const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
  XLSX.utils.book_append_sheet(wb, categoryWs, 'Category Performance');

  // Chart Data Sheet (for creating charts in Excel)
  const chartData = [
    ['Template', 'Acceptance Rate'],
    ...analytics.slice(0, 10).map(t => [t.template_name, parseFloat(t.acceptance_rate.toFixed(2))])
  ];
  const chartWs = XLSX.utils.aoa_to_sheet(chartData);
  XLSX.utils.book_append_sheet(wb, chartWs, 'Chart Data');

  XLSX.writeFile(wb, `template-analytics-${new Date().toISOString().split('T')[0]}.xlsx`);
}
