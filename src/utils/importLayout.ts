export interface ImportLayoutItem {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_CARD_WIDTH = 220;
const DEFAULT_CARD_HEIGHT = 140;
const COLUMN_GAP = 30;
const ROW_GAP = 40;
const EDGE_GAP = 80;

/**
 * Gives a bulk import a predictable grid layout and starts it clear of the
 * existing board content. Keeping this pure makes the placement easy to
 * verify without mounting the canvas.
 */
export function getImportLayout(
  count: number,
  occupied: ImportLayoutItem[] = [],
): ImportLayoutItem[] {
  if (count <= 0) return [];

  const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(count))));
  const startX = occupied.length > 0
    ? Math.max(...occupied.map(item => item.x + item.width)) + EDGE_GAP
    : EDGE_GAP;
  const startY = occupied.length > 0
    ? Math.min(...occupied.map(item => item.y))
    : 100;

  return Array.from({ length: count }, (_, index) => ({
    x: startX + (index % columns) * (DEFAULT_CARD_WIDTH + COLUMN_GAP),
    y: startY + Math.floor(index / columns) * (DEFAULT_CARD_HEIGHT + ROW_GAP),
    width: DEFAULT_CARD_WIDTH,
    height: DEFAULT_CARD_HEIGHT,
  }));
}
