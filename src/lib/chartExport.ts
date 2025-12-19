// Chart export utility functions

export const exportChartAsPNG = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    // Use html2canvas if available, otherwise fallback to canvas API
    const canvas = await createCanvasFromElement(element);
    const dataUrl = canvas.toDataURL('image/png');
    downloadImage(dataUrl, filename);
  } catch (error) {
    console.error('Failed to export chart:', error);
  }
};

export const exportChartAsSVG = (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const svgElement = element.querySelector('svg');
  if (!svgElement) return;

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const createCanvasFromElement = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const rect = element.getBoundingClientRect();
  canvas.width = rect.width * 2;
  canvas.height = rect.height * 2;
  ctx.scale(2, 2);

  // Draw white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, rect.width, rect.height);

  return canvas;
};

const downloadImage = (dataUrl: string, filename: string) => {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
};
