import { useBoardStore } from '../../store/boardStore';
import type { Tool } from '../../types/board';
import {
  IconCursor, IconStickyNote, IconLink, IconGroup, IconHand,
  IconZoomIn, IconZoomOut, IconZoomFit,
  IconUndo, IconRedo,
  IconExport, IconImport,
} from '../Icons/Icons';
import './CanvasToolbar.css';

interface ToolConfig {
  id: Tool;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
}

const TOOLS: ToolConfig[] = [
  { id: 'select', icon: <IconCursor />, label: 'Select', shortcut: 'V' },
  { id: 'card', icon: <IconStickyNote />, label: 'Add Card', shortcut: 'N' },
  { id: 'connector', icon: <IconLink />, label: 'Connect', shortcut: 'C' },
  { id: 'cluster', icon: <IconGroup />, label: 'Group', shortcut: 'G' },
  { id: 'hand', icon: <IconHand />, label: 'Pan', shortcut: 'H' },
];

interface CanvasToolbarProps {
  onOpenExport: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ onOpenExport }) => {
  const {
    activeTool, setActiveTool,
    zoomIn, zoomOut, zoomToFit, resetView,
    viewport,
    undo, redo,
    history, historyIndex,
    cards,
    importFromJSON,
  } = useBoardStore();

  const zoomPercent = Math.round(viewport.scale * 100);
  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        importFromJSON(data);
      } catch (err) {
        console.error('Failed to import board:', err);
        alert('Invalid board file.');
      }
    };
    input.click();
  };

  return (
    <div className="canvas-toolbar">
      {/* Tools section */}
      <div className="toolbar-section">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`toolbar-btn ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => setActiveTool(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
            <span className="toolbar-tooltip">
              {tool.label}
              <kbd>{tool.shortcut}</kbd>
            </span>
          </button>
        ))}
      </div>

      <div className="toolbar-divider" />

      {/* Zoom section */}
      <div className="toolbar-section">
        <button className="toolbar-btn" onClick={zoomOut} title="Zoom out">
          <IconZoomOut />
        </button>
        <button
          className="toolbar-btn toolbar-zoom-display"
          onClick={resetView}
          title="Reset zoom"
        >
          <span className="toolbar-zoom-text">{zoomPercent}%</span>
        </button>
        <button className="toolbar-btn" onClick={zoomIn} title="Zoom in">
          <IconZoomIn />
        </button>
        <button className="toolbar-btn" onClick={zoomToFit} title="Zoom to fit (F)">
          <IconZoomFit />
          <span className="toolbar-tooltip">
            Fit All
            <kbd>F</kbd>
          </span>
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* History section */}
      <div className="toolbar-section">
        <button
          className={`toolbar-btn ${!canUndo ? 'disabled' : ''}`}
          onClick={undo}
          disabled={!canUndo}
          title="Undo (⌘Z)"
        >
          <IconUndo />
        </button>
        <button
          className={`toolbar-btn ${!canRedo ? 'disabled' : ''}`}
          onClick={redo}
          disabled={!canRedo}
          title="Redo (⌘⇧Z)"
        >
          <IconRedo />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* File section */}
      <div className="toolbar-section">
        <button className="toolbar-btn" onClick={onOpenExport} title="Export board (⌘E)">
          <IconExport />
          <span className="toolbar-tooltip">
            Export
            <kbd>⌘E</kbd>
          </span>
        </button>
        <button className="toolbar-btn" onClick={handleImportJSON} title="Import board">
          <IconImport />
          <span className="toolbar-tooltip">
            Import
          </span>
        </button>
      </div>

      {/* Card count badge */}
      {cards.length > 0 && (
        <div className="toolbar-badge">
          {cards.length}
        </div>
      )}
    </div>
  );
};
