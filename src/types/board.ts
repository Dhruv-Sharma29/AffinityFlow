// ─── Card Colors ────────────────────────────────────────────────────
export type CardColor = 'cream' | 'yellow' | 'pink' | 'green' | 'blue' | 'purple';

export const CARD_COLORS: Record<CardColor, { bg: string; border: string; eyebrow: string; pin: string }> = {
  cream:  { bg: '#f4ecd8', border: '#e0d3ae', eyebrow: '#a3312b', pin: '#c0392b' },
  yellow: { bg: '#fff9c4', border: '#f0e68c', eyebrow: '#b8860b', pin: '#daa520' },
  pink:   { bg: '#fce4ec', border: '#f8bbd0', eyebrow: '#c2185b', pin: '#e91e63' },
  green:  { bg: '#e8f5e9', border: '#c8e6c9', eyebrow: '#2e7d32', pin: '#4caf50' },
  blue:   { bg: '#e3f2fd', border: '#bbdefb', eyebrow: '#1565c0', pin: '#2196f3' },
  purple: { bg: '#f3e5f5', border: '#e1bee7', eyebrow: '#7b1fa2', pin: '#9c27b0' },
};

// ─── Card ───────────────────────────────────────────────────────────
export interface Card {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: CardColor;
  title: string;
  body: string;
  eyebrow: string;
  clusterId?: string;
  zIndex: number;
  rotation: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Connector ──────────────────────────────────────────────────────
export type ConnectorStyle = 'solid' | 'dashed';
export type ConnectorColor = 'red' | 'blue' | 'gray';

export const CONNECTOR_COLORS: Record<ConnectorColor, string> = {
  red:  '#a3312b',
  blue: '#2f4a63',
  gray: '#888888',
};

export interface Connector {
  id: string;
  fromCardId: string;
  toCardId: string;
  color: ConnectorColor;
  style: ConnectorStyle;
}

// ─── Cluster ────────────────────────────────────────────────────────
export interface Cluster {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Tool ───────────────────────────────────────────────────────────
export type Tool = 'select' | 'card' | 'connector' | 'cluster' | 'hand';

// ─── Viewport ───────────────────────────────────────────────────────
export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

// ─── Board State ────────────────────────────────────────────────────
export interface BoardState {
  cards: Card[];
  connectors: Connector[];
  clusters: Cluster[];
}

// ─── History Entry (for undo/redo) ──────────────────────────────────
export interface HistoryEntry {
  cards: Card[];
  connectors: Connector[];
  clusters: Cluster[];
}
