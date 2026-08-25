import { useEffect, useCallback, useState } from 'react';
import { InfiniteCanvas } from './components/Canvas/InfiniteCanvas';
import { CanvasToolbar } from './components/Canvas/CanvasToolbar';
import { CardEditor } from './components/Card/CardEditor';
import { ShapeTextEditor } from './components/Shape/ShapeTextEditor';
import { ConnectorLabelEditor } from './components/Connector/ConnectorLabelEditor';
import { ExportModal } from './components/Export/ExportModal';
import { TemplateModal } from './components/Template/TemplateModal';
import { ContextMenu } from './components/ContextMenu/ContextMenu';
import { FloatingFormatBar } from './components/Card/FloatingFormatBar';
import { ShapeFormatBar } from './components/Shape/ShapeFormatBar';
import { Minimap } from './components/Minimap/Minimap';
import { useBoardStore } from './store/boardStore';
import type { Tool } from './types/board';
import './App.css';

// ─── Keyboard shortcut map ──────────────────────────────────────────
const TOOL_SHORTCUTS: Record<string, Tool> = {
  v: 'select',
  n: 'card',
  s: 'shape',
  c: 'connector',
  g: 'cluster',
  h: 'hand',
};

function App() {
  const {
    setActiveTool,
    deleteSelected,
    undo,
    redo,
    editingCardId,
    editingShapeId,
    editingConnectorId,
    selectedIds,
    activeTool,
    connectingFromId,
    setConnectingFromId,
  } = useBoardStore();

  const [exportOpen, setExportOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // ─── Keyboard shortcuts ────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't capture shortcuts when editing a card/shape/connector or export/templates is open
      if (editingCardId || editingShapeId || editingConnectorId || exportOpen || templatesOpen) return;

      // Don't capture when typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const key = e.key.toLowerCase();

      // Cmd/Ctrl + E → export
      if (key === 'e' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setExportOpen(true);
        return;
      }

      // Tool shortcuts
      if (TOOL_SHORTCUTS[key] && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setActiveTool(TOOL_SHORTCUTS[key]);
        return;
      }

      // Space → hand tool (while held)
      if (key === ' ' && !e.repeat) {
        e.preventDefault();
        setActiveTool('hand');
        return;
      }

      // Delete / Backspace → delete selected
      if ((key === 'delete' || key === 'backspace') && selectedIds.length > 0) {
        e.preventDefault();
        deleteSelected();
        return;
      }

      // Ctrl/Cmd + Z → undo
      if (key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y → redo
      if (
        (key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) ||
        (key === 'y' && (e.metaKey || e.ctrlKey))
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Escape → cancel connecting / clear selection
      if (key === 'escape') {
        if (connectingFromId) {
          setConnectingFromId(null);
        }
        setActiveTool('select');
        return;
      }

      // F → zoom to fit
      if (key === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        useBoardStore.getState().zoomToFit();
        return;
      }

      // + / = → zoom in
      if ((key === '+' || key === '=') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        useBoardStore.getState().zoomIn();
        return;
      }

      // - → zoom out
      if (key === '-' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        useBoardStore.getState().zoomOut();
        return;
      }
    },
    [editingCardId, editingShapeId, selectedIds, deleteSelected, undo, redo, setActiveTool, connectingFromId, setConnectingFromId, exportOpen]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (editingCardId || editingShapeId) return;
      // Release space → back to select
      if (e.key === ' ' && activeTool === 'hand') {
        setActiveTool('select');
      }
    },
    [activeTool, setActiveTool, editingCardId, editingShapeId]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="app">
      {/* Watermark / title */}
      <div className="app-watermark">
        <div className="app-watermark-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15.5 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8.5L15.5 3z"/>
            <polyline points="14 3 14 9 21 9"/>
          </svg>
        </div>
        <span className="app-watermark-title">AffinityFlow</span>
      </div>

      {/* Hint bar (contextual) */}
      <div className="app-hint-bar">
        {activeTool === 'select' && !selectedIds.length && (
          <span><kbd>Double-click</kbd> to add a card · Scroll to zoom · <kbd>N</kbd> new card · <kbd>S</kbd> shape · <kbd>C</kbd> connect</span>
        )}
        {activeTool === 'select' && selectedIds.length > 0 && (
          <span>
            {selectedIds.length} selected · <kbd>Delete</kbd> remove · <kbd>Shift</kbd>+click multi-select · Drag handles to resize · Right-click for options
          </span>
        )}
        {activeTool === 'card' && (
          <span>Click to place a card · <kbd>Esc</kbd> cancel</span>
        )}
        {activeTool === 'shape' && (
          <span>Click to place or drag to size shape · <kbd>Esc</kbd> cancel</span>
        )}
        {activeTool === 'connector' && !connectingFromId && (
          <span>Click a card or shape to start connection · <kbd>Esc</kbd> cancel</span>
        )}
        {activeTool === 'connector' && connectingFromId && (
          <span>Click another card or shape to connect · <kbd>Esc</kbd> cancel</span>
        )}
        {activeTool === 'cluster' && (
          <span>Click to place a group · <kbd>Esc</kbd> cancel</span>
        )}
        {activeTool === 'hand' && (
          <span>Drag to pan · Release <kbd>Space</kbd> to return</span>
        )}
      </div>

      {/* Canvas */}
      <InfiniteCanvas />

      {/* Toolbar */}
      <CanvasToolbar
        onOpenExport={() => setExportOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
      />

      {/* Card Editor */}
      <CardEditor />

      {/* Shape Text Editor */}
      <ShapeTextEditor />

      {/* Connector Label Editor */}
      <ConnectorLabelEditor />

      {/* Floating Format Bar for selected card */}
      <FloatingFormatBar />

      {/* Floating Format Bar for selected shape */}
      <ShapeFormatBar />

      {/* Context Menu */}
      <ContextMenu />

      {/* Minimap radar overview */}
      <Minimap />

      {/* Export Modal */}
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />

      {/* Sensemaking Templates Modal */}
      <TemplateModal isOpen={templatesOpen} onClose={() => setTemplatesOpen(false)} />
    </div>
  );
}

export default App;

