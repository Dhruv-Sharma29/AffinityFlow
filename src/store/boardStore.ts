import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Card, Connector, Cluster, Tool, Viewport,
  CardColor, ConnectorColor, ConnectorStyle,
  BoardState, HistoryEntry,
} from '../types/board';

// ─── Constants ──────────────────────────────────────────────────────
const MAX_HISTORY = 50;
const DEFAULT_CARD_WIDTH = 220;
const DEFAULT_CARD_HEIGHT = 140;

// ─── Store Interface ────────────────────────────────────────────────
interface BoardStore {
  // State
  cards: Card[];
  connectors: Connector[];
  clusters: Cluster[];
  selectedIds: string[];
  activeTool: Tool;
  viewport: Viewport;
  editingCardId: string | null;
  connectingFromId: string | null;

  // History
  history: HistoryEntry[];
  historyIndex: number;

  // Card actions
  addCard: (x: number, y: number, color?: CardColor) => string;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  moveCard: (id: string, x: number, y: number) => void;
  bringToFront: (id: string) => void;

  // Connector actions
  addConnector: (fromCardId: string, toCardId: string, color?: ConnectorColor, style?: ConnectorStyle) => string;
  deleteConnector: (id: string) => void;

  // Cluster actions
  addCluster: (x: number, y: number) => string;
  updateCluster: (id: string, updates: Partial<Cluster>) => void;
  deleteCluster: (id: string) => void;

  // Selection
  setSelectedIds: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  deleteSelected: () => void;

  // Tool
  setActiveTool: (tool: Tool) => void;

  // Viewport
  setViewport: (viewport: Partial<Viewport>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  resetView: () => void;

  // Editing
  setEditingCardId: (id: string | null) => void;
  setConnectingFromId: (id: string | null) => void;

  // History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Serialization
  exportToJSON: () => BoardState;
  importFromJSON: (state: BoardState) => void;
  clearBoard: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────
function getMaxZIndex(cards: Card[]): number {
  return cards.reduce((max, c) => Math.max(max, c.zIndex), 0);
}

function randomRotation(): number {
  return (Math.random() - 0.5) * 6; // -3 to +3 degrees
}

function snapshot(cards: Card[], connectors: Connector[], clusters: Cluster[]): HistoryEntry {
  return {
    cards: cards.map(c => ({ ...c })),
    connectors: connectors.map(c => ({ ...c })),
    clusters: clusters.map(c => ({ ...c })),
  };
}

// ─── Store ──────────────────────────────────────────────────────────
export const useBoardStore = create<BoardStore>((set, get) => ({
  // Initial state
  cards: [],
  connectors: [],
  clusters: [],
  selectedIds: [],
  activeTool: 'select',
  viewport: { x: 0, y: 0, scale: 1 },
  editingCardId: null,
  connectingFromId: null,
  history: [],
  historyIndex: -1,

  // ── Card Actions ────────────────────────────────────────────────
  addCard: (x, y, color = 'cream') => {
    const id = uuidv4();
    const now = new Date().toISOString();
    get().pushHistory();
    set(state => ({
      cards: [
        ...state.cards,
        {
          id,
          x,
          y,
          width: DEFAULT_CARD_WIDTH,
          height: DEFAULT_CARD_HEIGHT,
          color,
          title: '',
          body: '',
          eyebrow: '',
          zIndex: getMaxZIndex(state.cards) + 1,
          rotation: randomRotation(),
          createdAt: now,
          updatedAt: now,
        },
      ],
      editingCardId: id,
      selectedIds: [id],
    }));
    return id;
  },

  updateCard: (id, updates) => {
    get().pushHistory();
    set(state => ({
      cards: state.cards.map(c =>
        c.id === id
          ? { ...c, ...updates, updatedAt: new Date().toISOString() }
          : c
      ),
    }));
  },

  deleteCard: (id) => {
    get().pushHistory();
    set(state => ({
      cards: state.cards.filter(c => c.id !== id),
      connectors: state.connectors.filter(
        c => c.fromCardId !== id && c.toCardId !== id
      ),
      selectedIds: state.selectedIds.filter(s => s !== id),
      editingCardId: state.editingCardId === id ? null : state.editingCardId,
    }));
  },

  moveCard: (id, x, y) => {
    set(state => ({
      cards: state.cards.map(c =>
        c.id === id ? { ...c, x, y, updatedAt: new Date().toISOString() } : c
      ),
    }));
  },

  bringToFront: (id) => {
    set(state => ({
      cards: state.cards.map(c =>
        c.id === id
          ? { ...c, zIndex: getMaxZIndex(state.cards) + 1 }
          : c
      ),
    }));
  },

  // ── Connector Actions ───────────────────────────────────────────
  addConnector: (fromCardId, toCardId, color = 'red', style = 'solid') => {
    // Prevent duplicate connections
    const existing = get().connectors.find(
      c =>
        (c.fromCardId === fromCardId && c.toCardId === toCardId) ||
        (c.fromCardId === toCardId && c.toCardId === fromCardId)
    );
    if (existing) return existing.id;

    const id = uuidv4();
    get().pushHistory();
    set(state => ({
      connectors: [...state.connectors, { id, fromCardId, toCardId, color, style }],
    }));
    return id;
  },

  deleteConnector: (id) => {
    get().pushHistory();
    set(state => ({
      connectors: state.connectors.filter(c => c.id !== id),
      selectedIds: state.selectedIds.filter(s => s !== id),
    }));
  },

  // ── Cluster Actions ─────────────────────────────────────────────
  addCluster: (x, y) => {
    const id = uuidv4();
    get().pushHistory();
    set(state => ({
      clusters: [
        ...state.clusters,
        { id, label: 'New Group', x, y, width: 300, height: 200 },
      ],
    }));
    return id;
  },

  updateCluster: (id, updates) => {
    get().pushHistory();
    set(state => ({
      clusters: state.clusters.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  deleteCluster: (id) => {
    get().pushHistory();
    set(state => ({
      clusters: state.clusters.filter(c => c.id !== id),
      selectedIds: state.selectedIds.filter(s => s !== id),
    }));
  },

  // ── Selection ───────────────────────────────────────────────────
  setSelectedIds: (ids) => set({ selectedIds: ids }),

  toggleSelection: (id) => {
    set(state => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter(s => s !== id)
        : [...state.selectedIds, id],
    }));
  },

  clearSelection: () => set({ selectedIds: [], editingCardId: null }),

  deleteSelected: () => {
    const { selectedIds, cards, connectors, clusters } = get();
    if (selectedIds.length === 0) return;
    get().pushHistory();
    const cardIds = new Set(selectedIds.filter(id => cards.some(c => c.id === id)));
    const connectorIds = new Set(selectedIds.filter(id => connectors.some(c => c.id === id)));
    const clusterIds = new Set(selectedIds.filter(id => clusters.some(c => c.id === id)));

    set(state => ({
      cards: state.cards.filter(c => !cardIds.has(c.id)),
      connectors: state.connectors.filter(
        c => !connectorIds.has(c.id) && !cardIds.has(c.fromCardId) && !cardIds.has(c.toCardId)
      ),
      clusters: state.clusters.filter(c => !clusterIds.has(c.id)),
      selectedIds: [],
      editingCardId: null,
    }));
  },

  // ── Tool ────────────────────────────────────────────────────────
  setActiveTool: (tool) => set({ activeTool: tool, connectingFromId: null }),

  // ── Viewport ────────────────────────────────────────────────────
  setViewport: (viewport) =>
    set(state => ({ viewport: { ...state.viewport, ...viewport } })),

  zoomIn: () =>
    set(state => ({
      viewport: {
        ...state.viewport,
        scale: Math.min(state.viewport.scale * 1.2, 4),
      },
    })),

  zoomOut: () =>
    set(state => ({
      viewport: {
        ...state.viewport,
        scale: Math.max(state.viewport.scale / 1.2, 0.1),
      },
    })),

  zoomToFit: () => {
    const { cards, clusters } = get();
    if (cards.length === 0 && clusters.length === 0) {
      set({ viewport: { x: 0, y: 0, scale: 1 } });
      return;
    }

    const allItems = [
      ...cards.map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })),
      ...clusters.map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })),
    ];

    const minX = Math.min(...allItems.map(i => i.x)) - 60;
    const minY = Math.min(...allItems.map(i => i.y)) - 60;
    const maxX = Math.max(...allItems.map(i => i.x + i.w)) + 60;
    const maxY = Math.max(...allItems.map(i => i.y + i.h)) + 60;

    const contentW = maxX - minX;
    const contentH = maxY - minY;

    const stageW = window.innerWidth;
    const stageH = window.innerHeight;

    const scale = Math.min(stageW / contentW, stageH / contentH, 2);
    const x = (stageW - contentW * scale) / 2 - minX * scale;
    const y = (stageH - contentH * scale) / 2 - minY * scale;

    set({ viewport: { x, y, scale } });
  },

  resetView: () => set({ viewport: { x: 0, y: 0, scale: 1 } }),

  // ── Editing ─────────────────────────────────────────────────────
  setEditingCardId: (id) => set({ editingCardId: id }),
  setConnectingFromId: (id) => set({ connectingFromId: id }),

  // ── History ─────────────────────────────────────────────────────
  pushHistory: () => {
    const { cards, connectors, clusters, history, historyIndex } = get();
    const entry = snapshot(cards, connectors, clusters);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(entry);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < 0) return;
    const entry = history[historyIndex];
    set({
      cards: entry.cards.map(c => ({ ...c })),
      connectors: entry.connectors.map(c => ({ ...c })),
      clusters: entry.clusters.map(c => ({ ...c })),
      historyIndex: historyIndex - 1,
      selectedIds: [],
      editingCardId: null,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1];
    set({
      cards: entry.cards.map(c => ({ ...c })),
      connectors: entry.connectors.map(c => ({ ...c })),
      clusters: entry.clusters.map(c => ({ ...c })),
      historyIndex: historyIndex + 1,
      selectedIds: [],
      editingCardId: null,
    });
  },

  // ── Serialization ───────────────────────────────────────────────
  exportToJSON: () => {
    const { cards, connectors, clusters } = get();
    return { cards, connectors, clusters };
  },

  importFromJSON: (state) => {
    get().pushHistory();
    set({
      cards: state.cards,
      connectors: state.connectors,
      clusters: state.clusters,
      selectedIds: [],
      editingCardId: null,
    });
  },

  clearBoard: () => {
    get().pushHistory();
    set({
      cards: [],
      connectors: [],
      clusters: [],
      selectedIds: [],
      editingCardId: null,
    });
  },
}));
