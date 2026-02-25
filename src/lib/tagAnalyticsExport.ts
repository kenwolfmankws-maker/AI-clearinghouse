// Tag Analytics Export Service
import { jsPDF } from 'jspdf';

export interface ExportOptions {
  format: 'csv' | 'pdf';
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  metrics: {
    tagStats: boolean;
    usageOverTime: boolean;
    topTags: boolean;
    distribution: boolean;
  };
}

export const tagAnalyticsExport = {
  exportToCSV: (data: any[], usageOverTime: any[], options: ExportOptions) => {
    let csv = '';
    
    // Add header
    csv += 'Tag Analytics Report\n';
    csv += `Generated: ${new Date().toLocaleString()}\n`;
    if (options.dateRange.start || options.dateRange.end) {
      csv += `Date Range: ${options.dateRange.start?.toLocaleDateString() || 'All'} - ${options.dateRange.end?.toLocaleDateString() || 'All'}\n`;
    }
    csv += '\n';

    // Filter data by date range
    const filteredData = filterByDateRange(data, options.dateRange);
    const filteredUsage = filterUsageByDateRange(usageOverTime, options.dateRange);

    // Tag Statistics
    if (options.metrics.tagStats) {
      csv += 'Tag Statistics\n';
      csv += 'Tag Name,Conversations,Percentage\n';
      const total = filteredData.reduce((sum, t) => sum + t.conversationCount, 0);
      filteredData.forEach(tag => {
        const percentage = total > 0 ? ((tag.conversationCount / total) * 100).toFixed(1) : '0';
        csv += `"${tag.name}",${tag.conversationCount},${percentage}%\n`;
      });
      csv += '\n';
    }

    // Top Tags
    if (options.metrics.topTags) {
      csv += 'Top 10 Most Used Tags\n';
      csv += 'Rank,Tag Name,Conversations\n';
      const sorted = [...filteredData].sort((a, b) => b.conversationCount - a.conversationCount).slice(0, 10);
      sorted.forEach((tag, index) => {
        csv += `${index + 1},"${tag.name}",${tag.conversationCount}\n`;
      });
      csv += '\n';
    }

    // Usage Over Time
    if (options.metrics.usageOverTime && filteredUsage.length > 0) {
      csv += 'Tag Usage Over Time\n';
      const allTagNames = [...new Set(filteredData.map(t => t.name))];
      csv += 'Date,' + allTagNames.join(',') + '\n';
      filteredUsage.forEach(day => {
        const row = [day.date];
        allTagNames.forEach(tagName => {
          row.push((day[tagName] || 0).toString());
        });
        csv += row.join(',') + '\n';
      });
    }

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tag-analytics-${Date.now()}.csv`;
    link.click();
  },

  exportToPDF: (data: any[], usageOverTime: any[], options: ExportOptions) => {
    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Tag Analytics Report', 20, yPos);
    yPos += 10;

    // Metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
    yPos += 6;
    if (options.dateRange.start || options.dateRange.end) {
      doc.text(`Date Range: ${options.dateRange.start?.toLocaleDateString() || 'All'} - ${options.dateRange.end?.toLocaleDateString() || 'All'}`, 20, yPos);
      yPos += 6;
    }
    yPos += 10;

    const filteredData = filterByDateRange(data, options.dateRange);

    // Summary Statistics
    doc.setFontSize(14);
    doc.text('Summary', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.text(`Total Tags: ${filteredData.length}`, 20, yPos);
    yPos += 6;
    const totalConversations = filteredData.reduce((sum, t) => sum + t.conversationCount, 0);
    doc.text(`Total Tagged Conversations: ${totalConversations}`, 20, yPos);
    yPos += 6;
    const avgTags = filteredData.length > 0 ? (totalConversations / filteredData.length).toFixed(1) : '0';
    doc.text(`Average Tags per Conversation: ${avgTags}`, 20, yPos);
    yPos += 10;

    // Top Tags
    if (options.metrics.topTags) {
      doc.setFontSize(14);
      doc.text('Top 10 Most Used Tags', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      
      const sorted = [...filteredData].sort((a, b) => b.conversationCount - a.conversationCount).slice(0, 10);
      sorted.forEach((tag, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}. ${tag.name}: ${tag.conversationCount} conversations`, 25, yPos);
        yPos += 6;
      });
      yPos += 10;
    }

    // Tag Statistics Table
    if (options.metrics.tagStats) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.text('All Tags', 20, yPos);
      yPos += 8;
      doc.setFontSize(9);
      
      filteredData.forEach(tag => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        const percentage = totalConversations > 0 ? ((tag.conversationCount / totalConversations) * 100).toFixed(1) : '0';
        doc.text(`${tag.name}: ${tag.conversationCount} (${percentage}%)`, 25, yPos);
        yPos += 5;
      });
    }

    // Save PDF
    doc.save(`tag-analytics-${Date.now()}.pdf`);
  }
};

function filterByDateRange(data: any[], dateRange: { start: Date | null; end: Date | null }) {
  if (!dateRange.start && !dateRange.end) return data;
  // For now, return all data as we don't have date info in tag stats
  // In a real implementation, you'd filter based on when tags were created
  return data;
}

function filterUsageByDateRange(data: any[], dateRange: { start: Date | null; end: Date | null }) {
  if (!dateRange.start && !dateRange.end) return data;
  
  return data.filter(item => {
    const itemDate = new Date(item.date);
    if (dateRange.start && itemDate < dateRange.start) return false;
    if (dateRange.end && itemDate > dateRange.end) return false;
    return true;
  });
}
