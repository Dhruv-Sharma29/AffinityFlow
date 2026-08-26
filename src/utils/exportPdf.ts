import type Konva from 'konva';
import type { Card, Shape, Cluster } from '../types/board';

// ─── Types ──────────────────────────────────────────────────────────
export type ExportFormat = 'pdf' | 'png' | 'svg' | 'json';
export type ExportQuality = 'standard' | 'high' | 'ultra';

export interface ExportOptions {
  format: ExportFormat;
  quality: ExportQuality;
  title: string;
  includeTitle: boolean;
  includeTimestamp: boolean;
  backgroundColor: string;
  padding: number;
}

const QUALITY_MAP: Record<ExportQuality, number> = {
  standard: 1,
  high: 2,
  ultra: 3,
};

// ─── Bounding Box Calculation ───────────────────────────────────────
/**
 * Computes the bounding box that contains all cards, shapes, and clusters,
 * so export captures the full board regardless of viewport.
 */
function computeContentBounds(
  cards: Card[],
  shapes: Shape[] = [],
  clusters: Cluster[] = [],
  padding: number = 60
): { x: number; y: number; width: number; height: number } {
  if (cards.length === 0 && shapes.length === 0 && clusters.length === 0) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  const items = [
    ...cards.map(c => ({ x: c.x, y: c.y - 20, w: c.width, h: c.height + 20 })),
    ...shapes.map(s => ({ x: s.x, y: s.y, w: s.width, h: s.height })),
    ...clusters.map(c => ({ x: c.x, y: c.y - 30, w: c.width, h: c.height + 30 })),
  ];

  const minX = Math.min(...items.map(i => i.x)) - padding;
  const minY = Math.min(...items.map(i => i.y)) - padding;
  const maxX = Math.max(...items.map(i => i.x + i.w)) + padding;
  const maxY = Math.max(...items.map(i => i.y + i.h)) + padding;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// ─── Capture Full Board ─────────────────────────────────────────────
/**
 * Temporarily repositions the stage to capture the full board content,
 * then restores the original viewport.
 */
function captureFullBoard(
  stage: Konva.Stage,
  cards: Card[],
  shapes: Shape[],
  clusters: Cluster[],
  options: ExportOptions
): string {
  // Save current viewport
  const origX = stage.x();
  const origY = stage.y();
  const origScaleX = stage.scaleX();
  const origScaleY = stage.scaleY();
  const origWidth = stage.width();
  const origHeight = stage.height();

  const bounds = computeContentBounds(cards, shapes, clusters, options.padding);
  const pixelRatio = QUALITY_MAP[options.quality];

  // Temporarily adjust stage to frame the entire board
  stage.position({ x: -bounds.x, y: -bounds.y });
  stage.scale({ x: 1, y: 1 });
  stage.width(bounds.width);
  stage.height(bounds.height);
  stage.draw();

  const dataUrl = stage.toDataURL({
    pixelRatio,
    mimeType: 'image/png',
    x: 0,
    y: 0,
    width: bounds.width,
    height: bounds.height,
  });

  // Restore original viewport
  stage.position({ x: origX, y: origY });
  stage.scale({ x: origScaleX, y: origScaleY });
  stage.width(origWidth);
  stage.height(origHeight);
  stage.draw();

  return dataUrl;
}

// ─── Export to PDF ──────────────────────────────────────────────────
export async function exportToPdf(
  stage: Konva.Stage,
  cards: Card[],
  shapes: Shape[],
  clusters: Cluster[],
  options: ExportOptions
): Promise<void> {
  try {
    const { jsPDF } = await import('jspdf');
    const dataUrl = captureFullBoard(stage, cards, shapes, clusters, options);
    const bounds = computeContentBounds(cards, shapes, clusters, options.padding);

    // Determine page size — scale content to fit A4-ish proportions if very large
    const maxPageDim = 3000;
    let pageW = bounds.width;
    let pageH = bounds.height;

    if (pageW > maxPageDim || pageH > maxPageDim) {
      const scale = maxPageDim / Math.max(pageW, pageH);
      pageW *= scale;
      pageH *= scale;
    }

    // Header space
    const headerH = options.includeTitle ? 60 : 0;
    const totalH = pageH + headerH;

    const orientation = pageW > totalH ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [pageW, totalH],
    });

    // Background
    pdf.setFillColor(options.backgroundColor);
    pdf.rect(0, 0, pageW, totalH, 'F');

    // Title & timestamp header
    if (options.includeTitle) {
      // Title bar background
      pdf.setFillColor('#241d18');
      pdf.rect(0, 0, pageW, headerH, 'F');

      // Title text
      pdf.setFontSize(18);
      pdf.setTextColor('#f4ecd8');
      pdf.text(options.title || 'Affinity Board', 24, 28);

      // Timestamp
      if (options.includeTimestamp) {
        pdf.setFontSize(10);
        pdf.setTextColor('#8a7d6f');
        pdf.text(`Exported ${new Date().toLocaleString()}`, 24, 46);
      }

      // Total items count
      pdf.setFontSize(10);
      pdf.setTextColor('#8a7d6f');
      const totalItems = cards.length + shapes.length;
      const countText = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
      pdf.text(countText, pageW - 24 - pdf.getTextWidth(countText), 28);
    }

    // Canvas image
    pdf.addImage(dataUrl, 'PNG', 0, headerH, pageW, pageH);

    // Save
    const slug = (options.title || 'affinity-board').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    pdf.save(`${slug}-${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF. Please try again.');
  }
}

// ─── Export to PNG ──────────────────────────────────────────────────
export async function exportToPng(
  stage: Konva.Stage,
  cards: Card[],
  shapes: Shape[],
  clusters: Cluster[],
  options: ExportOptions
): Promise<void> {
  let dataUrl = captureFullBoard(stage, cards, shapes, clusters, options);

  if (options.backgroundColor && options.backgroundColor !== 'transparent') {
    dataUrl = await new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.fillStyle = options.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  const slug = (options.title || 'affinity-board').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${slug}-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Export to SVG ──────────────────────────────────────────────────
export function exportToSvg(
  stage: Konva.Stage,
  cards: Card[],
  shapes: Shape[],
  clusters: Cluster[],
  options: ExportOptions
): void {
  const dataUrl = captureFullBoard(stage, cards, shapes, clusters, options);
  const bounds = computeContentBounds(cards, shapes, clusters, options.padding);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${bounds.width}" height="${bounds.height}" 
     viewBox="0 0 ${bounds.width} ${bounds.height}">
  <title>${options.title || 'Affinity Board'}</title>
  <rect width="100%" height="100%" fill="${options.backgroundColor}"/>
  <image xlink:href="${dataUrl}" width="${bounds.width}" height="${bounds.height}"/>
</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const slug = (options.title || 'affinity-board').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}-${new Date().toISOString().slice(0, 10)}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Export to JSON ─────────────────────────────────────────────────
export function exportToJson(
  cards: Card[],
  shapes: Shape[],
  connectors: any[],
  clusters: Cluster[],
  options: ExportOptions
): void {
  const data = {
    title: options.title,
    exportedAt: new Date().toISOString(),
    cards,
    shapes,
    connectors,
    clusters,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const slug = (options.title || 'affinity-board').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

