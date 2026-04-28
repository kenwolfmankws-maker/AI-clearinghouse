export function exportChart() {
  return true;
}

export function exportChartAsSVG(elementId: string, filename: string): void {
  if (typeof document === "undefined") {
    console.warn("exportChartAsSVG can only run in the browser.");
    return;
  }

  const container = document.getElementById(elementId);
  if (!container) {
    console.warn(`Chart container not found: ${elementId}`);
    return;
  }

  const svg = container.querySelector("svg");
  if (!svg) {
    console.warn(`No SVG found inside chart container: ${elementId}`);
    return;
  }

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svg);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "chart.svg";
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  exportChart,
  exportChartAsSVG,
};
