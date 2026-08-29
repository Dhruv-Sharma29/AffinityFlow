import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Card, Shape, Connector, Cluster, Tool, Viewport,
  CardColor, ShapeType, ShapeColor, ConnectorColor, ConnectorStyle, ClusterColor,
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
  viewingCardId: string | null;
  editingShapeId: string | null;
  editingConnectorId: string | null;
  editingClusterId: string | null;
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
  addCluster: (x: number, y: number, width?: number, height?: number, label?: string, color?: ClusterColor) => string;
  updateCluster: (id: string, updates: Partial<Cluster>) => void;
  deleteCluster: (id: string) => void;
  groupSelected: () => string | null;
  ungroup: (id: string) => void;
  resizeCluster: (id: string, width: number, height: number, x?: number, y?: number) => void;
  duplicateCluster: (clusterId: string) => string | null;
  deleteClusterWithContents: (clusterId: string) => void;
  moveCluster: (id: string, x: number, y: number) => void;
  bringClusterToFront: (id: string) => void;
  setEditingClusterId: (id: string | null) => void;

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
  setViewingCardId: (id: string | null) => void;
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
  viewingCardId: null,
  editingShapeId: null,
  editingConnectorId: null,
  editingClusterId: null,
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
  addCluster: (x, y, width = 320, height = 220, label = 'New Group', color = 'slate') => {
    const id = uuidv4();
    get().pushHistory();
    if (get().soundEnabled) {
      SoundEffects.paperPlace();
    }
    set(state => ({
      clusters: [
        ...state.clusters,
        { id, label, x, y, width, height, color },
      ],
      selectedIds: [id],
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
      cards: state.cards.map(c => c.clusterId === id ? { ...c, clusterId: undefined } : c),
      shapes: state.shapes.map(s => s.clusterId === id ? { ...s, clusterId: undefined } : s),
      selectedIds: state.selectedIds.filter(s => s !== id),
      editingClusterId: state.editingClusterId === id ? null : state.editingClusterId,
    }));
  },

  groupSelected: () => {
    const { selectedIds, cards, shapes, clusters } = get();
    const selectedCards = cards.filter(c => selectedIds.includes(c.id));
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    const selectedClusters = clusters.filter(cl => selectedIds.includes(cl.id));

    const allItems: { x: number; y: number; width: number; height: number }[] = [
      ...selectedCards.map(c => ({ x: c.x, y: c.y, width: c.width, height: c.height })),
      ...selectedShapes.map(s => ({ x: s.x, y: s.y, width: s.width, height: s.height })),
      ...selectedClusters.map(cl => ({ x: cl.x, y: cl.y, width: cl.width, height: cl.height })),
    ];

    if (allItems.length === 0) return null;

    const PADDING_X = 28;
    const PADDING_TOP = 42;
    const PADDING_BOTTOM = 28;

    const minX = Math.min(...allItems.map(i => i.x)) - PADDING_X;
    const minY = Math.min(...allItems.map(i => i.y)) - PADDING_TOP;
    const maxX = Math.max(...allItems.map(i => i.x + i.width)) + PADDING_X;
    const maxY = Math.max(...allItems.map(i => i.y + i.height)) + PADDING_BOTTOM;

    const width = Math.max(160, maxX - minX);
    const height = Math.max(120, maxY - minY);

    const id = uuidv4();
    const nextGroupNum = clusters.length + 1;
    const label = `Group ${nextGroupNum}`;

    get().pushHistory();
    if (get().soundEnabled) {
      SoundEffects.paperPlace();
    }

    const cardIdSet = new Set(selectedCards.map(c => c.id));
    const shapeIdSet = new Set(selectedShapes.map(s => s.id));

    set(state => ({
      clusters: [
        ...state.clusters,
        { id, label, x: minX, y: minY, width, height, color: 'slate' },
      ],
      cards: state.cards.map(c => cardIdSet.has(c.id) ? { ...c, clusterId: id } : c),
      shapes: state.shapes.map(s => shapeIdSet.has(s.id) ? { ...s, clusterId: id } : s),
      selectedIds: [id],
      activeTool: 'select',
    }));

    return id;
  },

  ungroup: (id) => {
    const { clusters, cards, shapes } = get();
    const target = clusters.find(c => c.id === id);
    if (!target) return;

    get().pushHistory();
    if (get().soundEnabled) {
      SoundEffects.deleteItem();
    }

    const memberCardIds = cards
      .filter(c => c.clusterId === id || (
        c.x >= target.x && c.x + c.width <= target.x + target.width &&
        c.y >= target.y && c.y + c.height <= target.y + target.height
      ))
      .map(c => c.id);

    const memberShapeIds = shapes
      .filter(s => s.clusterId === id || (
        s.x >= target.x && s.x + s.width <= target.x + target.width &&
        s.y >= target.y && s.y + s.height <= target.y + target.height
      ))
      .map(s => s.id);

    set(state => ({
      clusters: state.clusters.filter(c => c.id !== id),
      cards: state.cards.map(c => c.clusterId === id ? { ...c, clusterId: undefined } : c),
      shapes: state.shapes.map(s => s.clusterId === id ? { ...s, clusterId: undefined } : s),
      selectedIds: [...memberCardIds, ...memberShapeIds],
      editingClusterId: state.editingClusterId === id ? null : state.editingClusterId,
    }));
  },

  resizeCluster: (id, width, height, x, y) => {
    get().pushHistory();
    set(state => ({
      clusters: state.clusters.map(c =>
        c.id === id
          ? {
              ...c,
              width: Math.max(80, Math.round(width)),
              height: Math.max(60, Math.round(height)),
              ...(x !== undefined ? { x: Math.round(x) } : {}),
              ...(y !== undefined ? { y: Math.round(y) } : {}),
            }
          : c
      ),
    }));
  },

  duplicateCluster: (clusterId) => {
    const { clusters, cards, shapes, connectors } = get();
    const cluster = clusters.find(c => c.id === clusterId);
    if (!cluster) return null;

    const containedCards = cards.filter(
      c => c.clusterId === cluster.id || (
        c.x >= cluster.x - 10 && c.x + c.width <= cluster.x + cluster.width + 10 &&
        c.y >= cluster.y - 10 && c.y + c.height <= cluster.y + cluster.height + 10
      )
    );
    const containedShapes = shapes.filter(
      s => s.clusterId === cluster.id || (
        s.x >= cluster.x - 10 && s.x + s.width <= cluster.x + cluster.width + 10 &&
        s.y >= cluster.y - 10 && s.y + s.height <= cluster.y + cluster.height + 10
      )
    );

    const OFFSET = 40;
    const newClusterId = uuidv4();
    const idMap = new Map<string, string>();

    const newCards: Card[] = containedCards.map(c => {
      const newId = uuidv4();
      idMap.set(c.id, newId);
      return {
        ...c,
        id: newId,
        clusterId: newClusterId,
        x: c.x + OFFSET,
        y: c.y + OFFSET,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const newShapes: Shape[] = containedShapes.map(s => {
      const newId = uuidv4();
      idMap.set(s.id, newId);
      return {
        ...s,
        id: newId,
        clusterId: newClusterId,
        x: s.x + OFFSET,
        y: s.y + OFFSET,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const containedItemIds = new Set([...containedCards.map(c => c.id), ...containedShapes.map(s => s.id)]);
    const internalConnectors = connectors.filter(
      conn => containedItemIds.has(conn.fromCardId) && containedItemIds.has(conn.toCardId)
    );

    const newConnectors: Connector[] = internalConnectors.map(conn => ({
      ...conn,
      id: uuidv4(),
      fromCardId: idMap.get(conn.fromCardId) || conn.fromCardId,
      toCardId: idMap.get(conn.toCardId) || conn.toCardId,
    }));

    const newCluster: Cluster = {
      ...cluster,
      id: newClusterId,
      label: `${cluster.label} (Copy)`,
      x: cluster.x + OFFSET,
      y: cluster.y + OFFSET,
    };

    get().pushHistory();
    if (get().soundEnabled) {
      SoundEffects.paperPlace();
    }

    set(state => ({
      clusters: [...state.clusters, newCluster],
      cards: [...state.cards, ...newCards],
      shapes: [...state.shapes, ...newShapes],
      connectors: [...state.connectors, ...newConnectors],
      selectedIds: [newClusterId],
    }));

    return newClusterId;
  },

  deleteClusterWithContents: (clusterId) => {
    const { clusters, cards, shapes } = get();
    const cluster = clusters.find(c => c.id === clusterId);
    if (!cluster) return;

    const containedCards = cards.filter(
      c => c.clusterId === cluster.id || (
        c.x >= cluster.x - 10 && c.x + c.width <= cluster.x + cluster.width + 10 &&
        c.y >= cluster.y - 10 && c.y + c.height <= cluster.y + cluster.height + 10
      )
    );
    const containedShapes = shapes.filter(
      s => s.clusterId === cluster.id || (
        s.x >= cluster.x - 10 && s.x + s.width <= cluster.x + cluster.width + 10 &&
        s.y >= cluster.y - 10 && s.y + s.height <= cluster.y + cluster.height + 10
      )
    );

    const cardIds = new Set(containedCards.map(c => c.id));
    const shapeIds = new Set(containedShapes.map(s => s.id));
    const removedItemIds = new Set([...cardIds, ...shapeIds]);

    get().pushHistory();
    if (get().soundEnabled) {
      SoundEffects.deleteItem();
    }

    set(state => ({
      clusters: state.clusters.filter(c => c.id !== clusterId),
      cards: state.cards.filter(c => !cardIds.has(c.id)),
      shapes: state.shapes.filter(s => !shapeIds.has(s.id)),
      connectors: state.connectors.filter(
        c => !removedItemIds.has(c.fromCardId) && !removedItemIds.has(c.toCardId)
      ),
      selectedIds: state.selectedIds.filter(id => id !== clusterId && !removedItemIds.has(id)),
      editingClusterId: state.editingClusterId === clusterId ? null : state.editingClusterId,
    }));
  },

  moveCluster: (id, x, y) => {
    const { clusters } = get();
    const cl = clusters.find(c => c.id === id);
    if (!cl) return;
    const dx = x - cl.x;
    const dy = y - cl.y;
    if (dx === 0 && dy === 0) return;

    set(state => {
      const currentCl = state.clusters.find(c => c.id === id);
      if (!currentCl) return state;
      return {
        clusters: state.clusters.map(c => c.id === id ? { ...c, x, y } : c),
        cards: state.cards.map(c => {
          if (c.clusterId === id || (
            c.x >= currentCl.x - 5 && c.x + c.width <= currentCl.x + currentCl.width + 5 &&
            c.y >= currentCl.y - 5 && c.y + c.height <= currentCl.y + currentCl.height + 5
          )) {
            return { ...c, x: c.x + dx, y: c.y + dy, updatedAt: new Date().toISOString() };
          }
          return c;
        }),
        shapes: state.shapes.map(s => {
          if (s.clusterId === id || (
            s.x >= currentCl.x - 5 && s.x + s.width <= currentCl.x + currentCl.width + 5 &&
            s.y >= currentCl.y - 5 && s.y + s.height <= currentCl.y + currentCl.height + 5
          )) {
            return { ...s, x: s.x + dx, y: s.y + dy, updatedAt: new Date().toISOString() };
          }
          return s;
        }),
      };
    });
  },

  bringClusterToFront: (id) => {
    const { clusters } = get();
    const target = clusters.find(c => c.id === id);
    if (!target) return;
    set(state => ({
      clusters: [...state.clusters.filter(c => c.id !== id), target],
    }));
  },

  setEditingClusterId: (id) => set({ editingClusterId: id }),

  // ── Selection & Multi-drag ───────────────────────────────────────
  setSelectedIds: (ids) => set({ selectedIds: ids }),

  toggleSelection: (id) => {
    set(state => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter(s => s !== id)
        : [...state.selectedIds, id],
    }));
  },

  clearSelection: () => set({ selectedIds: [], editingCardId: null, editingShapeId: null, editingConnectorId: null, editingClusterId: null }),

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
      editingClusterId: null,
    }));
  },

  moveMultipleItems: (dx, dy, itemIds) => {
    if (itemIds.length === 0 || (dx === 0 && dy === 0)) return;
    const idSet = new Set(itemIds);

    const { clusters, cards, shapes } = get();
    const clustersInMove = clusters.filter(cl => idSet.has(cl.id));
    const autoMovedCardIds = new Set<string>();
    const autoMovedShapeIds = new Set<string>();

    clustersInMove.forEach(cl => {
      cards.forEach(c => {
        if (c.clusterId === cl.id || (
          c.x >= cl.x - 5 && c.x + c.width <= cl.x + cl.width + 5 &&
          c.y >= cl.y - 5 && c.y + c.height <= cl.y + cl.height + 5
        )) {
          autoMovedCardIds.add(c.id);
        }
      });
      shapes.forEach(s => {
        if (s.clusterId === cl.id || (
          s.x >= cl.x - 5 && s.x + s.width <= cl.x + cl.width + 5 &&
          s.y >= cl.y - 5 && s.y + s.height <= cl.y + cl.height + 5
        )) {
          autoMovedShapeIds.add(s.id);
        }
      });
    });

    set(state => ({
      cards: state.cards.map(c => (idSet.has(c.id) || autoMovedCardIds.has(c.id)) ? { ...c, x: c.x + dx, y: c.y + dy, updatedAt: new Date().toISOString() } : c),
      shapes: state.shapes.map(s => (idSet.has(s.id) || autoMovedShapeIds.has(s.id)) ? { ...s, x: s.x + dx, y: s.y + dy, updatedAt: new Date().toISOString() } : s),
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
  setEditingCardId: (id) => set({ editingCardId: id, viewingCardId: null, editingShapeId: null }),
  setViewingCardId: (id) => set({ viewingCardId: id }),
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
      editingClusterId: null,
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
      editingClusterId: null,
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
      editingClusterId: null,
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
      editingClusterId: null,
    });
  },
}));

