import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Card, Shape, Connector, Cluster, Tool, Viewport,
  CardColor, ShapeType, ShapeColor, ConnectorColor, ConnectorStyle,
  BoardState, HistoryEntry,
} from '../types/board';
import { getShapeDefinition } from '../components/Shape/shapeRegistry';
import { SoundEffects } from '../utils/soundEffects';

// ─── Constants ──────────────────────────────────────────────────────
const MAX_HISTORY = 50;
const DEFAULT_CARD_WIDTH = 220;
const DEFAULT_CARD_HEIGHT = 140;

// ─── Store Interface ────────────────────────────────────────────────
interface BoardStore {
  // State
  cards: Card[];
  shapes: Shape[];
  connectors: Connector[];
  clusters: Cluster[];
  selectedIds: string[];
  activeTool: Tool;
  activeShapeType: ShapeType;
  viewport: Viewport;
  editingCardId: string | null;
  editingShapeId: string | null;
  editingConnectorId: string | null;
  connectingFromId: string | null;
  soundEnabled: boolean;

  // History
  history: HistoryEntry[];
  historyIndex: number;

  // Sound
  toggleSound: () => void;

  // Card actions
  addCard: (x: number, y: number, color?: CardColor) => string;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  moveCard: (id: string, x: number, y: number) => void;
  bringToFront: (id: string) => void;

  // Shape actions
  addShape: (type?: ShapeType, x?: number, y?: number, width?: number, height?: number, color?: ShapeColor, text?: string) => string;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  moveShape: (id: string, x: number, y: number) => void;
  resizeShape: (id: string, width: number, height: number, x?: number, y?: number, rotation?: number) => void;
  bringShapeToFront: (id: string) => void;
  setActiveShapeType: (type: ShapeType) => void;
  setEditingShapeId: (id: string | null) => void;

  // Connector actions
  addConnector: (fromCardId: string, toCardId: string, color?: ConnectorColor, style?: ConnectorStyle, label?: string) => string;
  updateConnector: (id: string, updates: Partial<Connector>) => void;
  deleteConnector: (id: string) => void;
  unlinkCard: (cardId: string) => void;
  setEditingConnectorId: (id: string | null) => void;

  // Cluster actions
  addCluster: (x: number, y: number) => string;
  updateCluster: (id: string, updates: Partial<Cluster>) => void;
  deleteCluster: (id: string) => void;

  // Selection & Multi-drag
  setSelectedIds: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  moveMultipleItems: (dx: number, dy: number, itemIds: string[]) => void;

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
function getMaxZIndex(cards: Card[], shapes: Shape[] = []): number {
  const cardMax = cards.reduce((max, c) => Math.max(max, c.zIndex), 0);
  const shapeMax = shapes.reduce((max, s) => Math.max(max, s.zIndex), 0);
  return Math.max(cardMax, shapeMax);
}

function randomRotation(): number {
  return (Math.random() - 0.5) * 6; // -3 to +3 degrees
}

function snapshot(cards: Card[], shapes: Shape[], connectors: Connector[], clusters: Cluster[]): HistoryEntry {
  return {
    cards: cards.map(c => ({ ...c })),
    shapes: shapes.map(s => ({ ...s })),
    connectors: connectors.map(c => ({ ...c })),
    clusters: clusters.map(c => ({ ...c })),
  };
}

// ─── Store ──────────────────────────────────────────────────────────
export const useBoardStore = create<BoardStore>((set, get) => ({
  // Initial state
  cards: [],
  shapes: [],
  connectors: [],
  clusters: [],
  selectedIds: [],
  activeTool: 'select',
  activeShapeType: 'rectangle',
  viewport: { x: 0, y: 0, scale: 1 },
  editingCardId: null,
  editingShapeId: null,
  editingConnectorId: null,
  connectingFromId: null,
  soundEnabled: typeof window !== 'undefined' ? localStorage.getItem('affinity_sound') !== 'false' : true,
  history: [],
  historyIndex: -1,

  // ── Sound ───────────────────────────────────────────────────────
  toggleSound: () => {
    const next = !get().soundEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('affinity_sound', String(next));
    }
    set({ soundEnabled: next });
  },

  // ── Card Actions ────────────────────────────────────────────────
  addCard: (x, y, color = 'cream') => {
    const id = uuidv4();
    const now = new Date().toISOString();
    get().pushHistory();
    if (get().soundEnabled) {
      SoundEffects.paperPlace();
      SoundEffects.pin();
    }
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
          zIndex: getMaxZIndex(state.cards, state.shapes) + 1,
          rotation: randomRotation(),
          createdAt: now,
          updatedAt: now,
        },
      ],
      editingCardId: id,
      editingShapeId: null,
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
          ? { ...c, zIndex: getMaxZIndex(state.cards, state.shapes) + 1 }
          : c
      ),
    }));
  },

  // ── Shape Actions ───────────────────────────────────────────────
  addShape: (type, x = 100, y = 100, width, height, color = 'cream', text = '') => {
    const shapeType = type || get().activeShapeType || 'rectangle';
    const def = getShapeDefinition(shapeType);
    const shapeWidth = width || def.defaultWidth;
    const shapeHeight = height || def.defaultHeight;
    const id = uuidv4();
    const now = new Date().toISOString();
    get().pushHistory();
    if (get().soundEnabled) {
      SoundEffects.paperPlace();
    }
    set(state => ({
      shapes: [
        ...state.shapes,
        {
          id,
          type: shapeType,
          x,
          y,
          width: shapeWidth,
          height: shapeHeight,
          color,
          text,
          rotation: 0,
          zIndex: getMaxZIndex(state.cards, state.shapes) + 1,
          createdAt: now,
          updatedAt: now,
        },
      ],
      editingCardId: null,
      editingShapeId: null,
      selectedIds: [id],
    }));
    return id;
  },

  updateShape: (id, updates) => {
    get().pushHistory();
    set(state => ({
      shapes: state.shapes.map(s =>
        s.id === id
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      ),
    }));
  },

  deleteShape: (id) => {
    get().pushHistory();
    if (get().soundEnabled) {
      SoundEffects.deleteItem();
    }
    set(state => ({
      shapes: state.shapes.filter(s => s.id !== id),
      connectors: state.connectors.filter(
        c => c.fromCardId !== id && c.toCardId !== id
      ),
      selectedIds: state.selectedIds.filter(s => s !== id),
      editingShapeId: state.editingShapeId === id ? null : state.editingShapeId,
    }));
  },

  moveShape: (id, x, y) => {
    set(state => ({
      shapes: state.shapes.map(s =>
        s.id === id ? { ...s, x, y, updatedAt: new Date().toISOString() } : s
      ),
    }));
  },

  resizeShape: (id, width, height, x, y, rotation) => {
    get().pushHistory();
    set(state => ({
      shapes: state.shapes.map(s =>
        s.id === id
          ? {
              ...s,
              width: Math.max(20, width),
              height: Math.max(20, height),
              ...(x !== undefined ? { x } : {}),
              ...(y !== undefined ? { y } : {}),
              ...(rotation !== undefined ? { rotation } : {}),
              updatedAt: new Date().toISOString(),
            }
          : s
      ),
    }));
  },

  bringShapeToFront: (id) => {
    set(state => ({
      shapes: state.shapes.map(s =>
        s.id === id
          ? { ...s, zIndex: getMaxZIndex(state.cards, state.shapes) + 1 }
          : s
      ),
    }));
  },

  setActiveShapeType: (type) => set({ activeShapeType: type }),

  setEditingShapeId: (id) => set({ editingShapeId: id }),

  // ── Connector Actions ───────────────────────────────────────────
  addConnector: (fromCardId, toCardId, color = 'red', style = 'solid', label?: string) => {
    // Prevent self-connection
    if (fromCardId === toCardId) return '';

    // Prevent duplicate connections
    const existing = get().connectors.find(
      c =>
        (c.fromCardId === fromCardId && c.toCardId === toCardId) ||
        (c.fromCardId === toCardId && c.toCardId === fromCardId)
    );
    if (existing) return existing.id;

    const id = uuidv4();
    get().pushHistory();
    if (get().soundEnabled) {
      SoundEffects.stringSnap();
    }
    set(state => ({
      connectors: [...state.connectors, { id, fromCardId, toCardId, color, style, label }],
    }));
    return id;
  },

  updateConnector: (id, updates) => {
    get().pushHistory();
    set(state => ({
      connectors: state.connectors.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  deleteConnector: (id) => {
    get().pushHistory();
    if (get().soundEnabled) {
      SoundEffects.deleteItem();
    }
    set(state => ({
      connectors: state.connectors.filter(c => c.id !== id),
      selectedIds: state.selectedIds.filter(s => s !== id),
      editingConnectorId: state.editingConnectorId === id ? null : state.editingConnectorId,
    }));
  },

  unlinkCard: (cardId) => {
    get().pushHistory();
    if (get().soundEnabled) {
      SoundEffects.deleteItem();
    }
    set(state => ({
      connectors: state.connectors.filter(
        c => c.fromCardId !== cardId && c.toCardId !== cardId
      ),
    }));
  },

  setEditingConnectorId: (id) => set({ editingConnectorId: id }),

  // ── Cluster Actions ─────────────────────────────────────────────
  addCluster: (x, y) => {
    const id = uuidv4();
    get().pushHistory();
    if (get().soundEnabled) {
      SoundEffects.paperPlace();
    }
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
    if (get().soundEnabled) {
      SoundEffects.deleteItem();
    }
    set(state => ({
      clusters: state.clusters.filter(c => c.id !== id),
      selectedIds: state.selectedIds.filter(s => s !== id),
    }));
  },

  // ── Selection & Multi-drag ───────────────────────────────────────
  setSelectedIds: (ids) => set({ selectedIds: ids }),

  toggleSelection: (id) => {
    set(state => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter(s => s !== id)
        : [...state.selectedIds, id],
    }));
  },

  clearSelection: () => set({ selectedIds: [], editingCardId: null, editingShapeId: null, editingConnectorId: null }),

  deleteSelected: () => {
    const { selectedIds, cards, shapes, connectors, clusters } = get();
    if (selectedIds.length === 0) return;
    get().pushHistory();
    if (get().soundEnabled) {
      SoundEffects.deleteItem();
    }
    const cardIds = new Set(selectedIds.filter(id => cards.some(c => c.id === id)));
    const shapeIds = new Set(selectedIds.filter(id => shapes.some(s => s.id === id)));
    const connectorIds = new Set(selectedIds.filter(id => connectors.some(c => c.id === id)));
    const clusterIds = new Set(selectedIds.filter(id => clusters.some(c => c.id === id)));
    const removedItemIds = new Set([...cardIds, ...shapeIds]);

    set(state => ({
      cards: state.cards.filter(c => !cardIds.has(c.id)),
      shapes: state.shapes.filter(s => !shapeIds.has(s.id)),
      connectors: state.connectors.filter(
        c => !connectorIds.has(c.id) && !removedItemIds.has(c.fromCardId) && !removedItemIds.has(c.toCardId)
      ),
      clusters: state.clusters.filter(c => !clusterIds.has(c.id)),
      selectedIds: [],
      editingCardId: null,
      editingShapeId: null,
      editingConnectorId: null,
    }));
  },

  moveMultipleItems: (dx, dy, itemIds) => {
    if (itemIds.length === 0 || (dx === 0 && dy === 0)) return;
    const idSet = new Set(itemIds);
    set(state => ({
      cards: state.cards.map(c => idSet.has(c.id) ? { ...c, x: c.x + dx, y: c.y + dy, updatedAt: new Date().toISOString() } : c),
      shapes: state.shapes.map(s => idSet.has(s.id) ? { ...s, x: s.x + dx, y: s.y + dy, updatedAt: new Date().toISOString() } : s),
      clusters: state.clusters.map(cl => idSet.has(cl.id) ? { ...cl, x: cl.x + dx, y: cl.y + dy } : cl),
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
    const { cards, shapes, clusters } = get();
    if (cards.length === 0 && shapes.length === 0 && clusters.length === 0) {
      set({ viewport: { x: 0, y: 0, scale: 1 } });
      return;
    }

    const allItems = [
      ...cards.map(c => ({ x: c.x, y: c.y, w: c.width, h: c.height })),
      ...shapes.map(s => ({ x: s.x, y: s.y, w: s.width, h: s.height })),
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
  setEditingCardId: (id) => set({ editingCardId: id, editingShapeId: null }),
  setConnectingFromId: (id) => set({ connectingFromId: id }),

  // ── History ─────────────────────────────────────────────────────
  pushHistory: () => {
    const { cards, shapes, connectors, clusters, history, historyIndex } = get();
    const entry = snapshot(cards, shapes, connectors, clusters);
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
      shapes: (entry.shapes || []).map(s => ({ ...s })),
      connectors: entry.connectors.map(c => ({ ...c })),
      clusters: entry.clusters.map(c => ({ ...c })),
      historyIndex: historyIndex - 1,
      selectedIds: [],
      editingCardId: null,
      editingShapeId: null,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1];
    set({
      cards: entry.cards.map(c => ({ ...c })),
      shapes: (entry.shapes || []).map(s => ({ ...s })),
      connectors: entry.connectors.map(c => ({ ...c })),
      clusters: entry.clusters.map(c => ({ ...c })),
      historyIndex: historyIndex + 1,
      selectedIds: [],
      editingCardId: null,
      editingShapeId: null,
    });
  },

  // ── Serialization ───────────────────────────────────────────────
  exportToJSON: () => {
    const { cards, shapes, connectors, clusters } = get();
    return { cards, shapes, connectors, clusters };
  },

  importFromJSON: (state) => {
    get().pushHistory();
    set({
      cards: state.cards || [],
      shapes: state.shapes || [],
      connectors: state.connectors || [],
      clusters: state.clusters || [],
      selectedIds: [],
      editingCardId: null,
      editingShapeId: null,
    });
  },

  clearBoard: () => {
    get().pushHistory();
    set({
      cards: [],
      shapes: [],
      connectors: [],
      clusters: [],
      selectedIds: [],
      editingCardId: null,
      editingShapeId: null,
    });
  },
}));

