import React, { useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import type { Tool, ShapeType } from '../../types/board';
import {
  IconCursor, IconStickyNote, IconLink, IconGroup, IconHand,
  IconZoomIn, IconZoomOut, IconZoomFit,
  IconUndo, IconRedo,
  IconExport, IconImport,
  IconTemplate,
  IconSoundOn, IconSoundOff,
} from '../Icons/Icons';
import { getAllShapeDefinitions, getShapeDefinition } from '../Shape/shapeRegistry';
import './CanvasToolbar.css';

interface ToolConfig {
  id: Tool;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
}

interface CanvasToolbarProps {
  onOpenExport: () => void;
  onOpenTemplates: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ onOpenExport, onOpenTemplates }) => {
  const {
    activeTool, setActiveTool,
    activeShapeType, setActiveShapeType,
    zoomIn, zoomOut, zoomToFit, resetView,
    viewport,
    undo, redo,
    history, historyIndex,
    cards, shapes,
    selectedIds,
    groupSelected,
    importFromJSON,
    soundEnabled, toggleSound,
  } = useBoardStore();

  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);

  const zoomPercent = Math.round(viewport.scale * 100);
  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  const currentShapeDef = getShapeDefinition(activeShapeType);
  const CurrentShapeIcon = currentShapeDef.icon;
  const allShapes = getAllShapeDefinitions();

  const TOOLS: ToolConfig[] = [
    { id: 'select', icon: <IconCursor />, label: 'Select', shortcut: 'V' },
    { id: 'card', icon: <IconStickyNote />, label: 'Add Card', shortcut: 'N' },
    { id: 'shape', icon: <CurrentShapeIcon />, label: `Shape (${currentShapeDef.label})`, shortcut: 'S' },
    { id: 'connector', icon: <IconLink />, label: 'Connect', shortcut: 'C' },
    { id: 'cluster', icon: <IconGroup />, label: 'Group', shortcut: 'G' },
    { id: 'hand', icon: <IconHand />, label: 'Pan', shortcut: 'H' },
  ];

  const handleToolClick = (toolId: Tool) => {
    if (toolId === 'cluster') {
      if (selectedIds.length > 0) {
        groupSelected();
        return;
      }
      setShapeMenuOpen(false);
      setActiveTool(activeTool === 'cluster' ? 'select' : 'cluster');
      return;
    }

    if (toolId === 'shape') {
      if (activeTool === 'shape') {
        setShapeMenuOpen(!shapeMenuOpen);
      } else {
        setActiveTool('shape');
      }
    } else {
      setShapeMenuOpen(false);
      setActiveTool(toolId);
    }
  };

  const handleShapeSelect = (type: ShapeType, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveShapeType(type);
    setActiveTool('shape');
    setShapeMenuOpen(false);
  };

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
        {TOOLS.map((tool) => {
          const isShapeTool = tool.id === 'shape';
          return (
            <div key={tool.id} className="toolbar-btn-wrapper">
              <button
                className={`toolbar-btn ${activeTool === tool.id ? 'active' : ''}`}
                onClick={() => handleToolClick(tool.id)}
                title={`${tool.label} (${tool.shortcut})`}
              >
                {tool.icon}
                <span className="toolbar-tooltip">
                  {tool.label}
                  <kbd>{tool.shortcut}</kbd>
                </span>
                {isShapeTool && (
                  <span className="toolbar-dropdown-caret">▾</span>
                )}
              </button>

              {/* Shape Tool Submenu Flyout */}
              {isShapeTool && shapeMenuOpen && (
                <div className="toolbar-shape-flyout">
                  <div className="toolbar-flyout-header">Shapes</div>
                  <div className="toolbar-flyout-grid">
                    {allShapes.map((def) => {
                      const Icon = def.icon;
                      return (
                        <button
                          key={def.type}
                          className={`toolbar-flyout-item ${activeShapeType === def.type && activeTool === 'shape' ? 'active' : ''}`}
                          onClick={(e) => handleShapeSelect(def.type, e)}
                          title={def.label}
                        >
                          <Icon size={18} />
                          <span>{def.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
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

      {/* File & Templates section */}
      <div className="toolbar-section">
        <button className="toolbar-btn" onClick={onOpenTemplates} title="Sensemaking Templates">
          <IconTemplate />
          <span className="toolbar-tooltip">
            Templates
          </span>
        </button>
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
        <button
          className={`toolbar-btn ${!soundEnabled ? 'dimmed' : ''}`}
          onClick={toggleSound}
          title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
        >
          {soundEnabled ? <IconSoundOn /> : <IconSoundOff />}
          <span className="toolbar-tooltip">
            {soundEnabled ? 'Sound On' : 'Muted'}
          </span>
        </button>
      </div>

      {/* Total Item count badge (cards + shapes) */}
      {(cards.length > 0 || shapes.length > 0) && (
        <div className="toolbar-badge" title={`${cards.length} cards, ${shapes.length} shapes`}>
          {cards.length + shapes.length}
        </div>
      )}
    </div>
  );
};

