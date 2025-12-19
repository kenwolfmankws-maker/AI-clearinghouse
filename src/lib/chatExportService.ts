import { jsPDF } from 'jspdf';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  created_at: string;
  messages: ChatMessage[];
}

export const exportChatToPDF = (conversation: ChatConversation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(conversation.title, margin, yPosition);
  yPosition += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(new Date(conversation.created_at).toLocaleString(), margin, yPosition);
  yPosition += 15;

  // Messages
  conversation.messages.forEach((msg) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const color = msg.role === 'user' ? [59, 130, 246] : [16, 185, 129];
    doc.setTextColor(color[0], color[1], color[2]);
    
    const label = msg.role === 'user' ? 'You' : 'AI Assistant';
    doc.text(label, margin, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    const lines = doc.splitTextToSize(msg.content, maxWidth);
    
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });

    yPosition += 8;
  });


  doc.save(`${conversation.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};

export const exportChatToTXT = (conversation: ChatConversation) => {
  let content = `${conversation.title}\n`;
  content += `Date: ${new Date(conversation.created_at).toLocaleString()}\n`;
  content += `${'='.repeat(60)}\n\n`;

  conversation.messages.forEach((msg) => {
    const label = msg.role === 'user' ? 'You' : 'AI Assistant';
    const timestamp = new Date(msg.timestamp).toLocaleTimeString();
    content += `[${timestamp}] ${label}:\n${msg.content}\n\n`;
  });

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportChatToJSON = (conversation: ChatConversation) => {
  const exportData = {
    title: conversation.title,
    created_at: conversation.created_at,
    exported_at: new Date().toISOString(),
    messages: conversation.messages
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
