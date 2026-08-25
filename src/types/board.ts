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

// ─── Shape Types & Colors ──────────────────────────────────────────
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'star' | 'hexagon';

export type ShapeColor = 'cream' | 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'slate' | 'transparent';

export const SHAPE_COLORS: Record<ShapeColor, { bg: string; border: string; text: string; pin: string }> = {
  cream:       { bg: '#f4ecd8', border: '#b89b72', text: '#2b2420', pin: '#c0392b' },
  yellow:      { bg: '#fff9c4', border: '#d4af37', text: '#3e2723', pin: '#daa520' },
  pink:        { bg: '#fce4ec', border: '#c2185b', text: '#4a148c', pin: '#e91e63' },
  green:       { bg: '#e8f5e9', border: '#2e7d32', text: '#1b5e20', pin: '#4caf50' },
  blue:        { bg: '#e3f2fd', border: '#1565c0', text: '#0d47a1', pin: '#2196f3' },
  purple:      { bg: '#f3e5f5', border: '#7b1fa2', text: '#4a148c', pin: '#9c27b0' },
  orange:      { bg: '#fff3e0', border: '#e65100', text: '#bf360c', pin: '#f57c00' },
  slate:       { bg: '#eceff1', border: '#455a64', text: '#263238', pin: '#607d8b' },
  transparent: { bg: 'transparent', border: '#5a4f42', text: '#2b2420', pin: '#2f4a63' },
};

// ─── Shape ──────────────────────────────────────────────────────────
export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: ShapeColor;
  text?: string;
  rotation: number;
  zIndex: number;
  clusterId?: string;
  createdAt: string;
  updatedAt: string;
}

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
  label?: string;
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
export type Tool = 'select' | 'card' | 'shape' | 'connector' | 'cluster' | 'hand';

// ─── Viewport ───────────────────────────────────────────────────────
export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

// ─── Board State ────────────────────────────────────────────────────
export interface BoardState {
  cards: Card[];
  shapes: Shape[];
  connectors: Connector[];
  clusters: Cluster[];
}

// ─── History Entry (for undo/redo) ──────────────────────────────────
export interface HistoryEntry {
  cards: Card[];
  shapes: Shape[];
  connectors: Connector[];
  clusters: Cluster[];
}

// ─── Template Definition ────────────────────────────────────────────
export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  state: BoardState;
}

