import React, { useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { SHAPE_COLORS } from '../../types/board';
import type { ShapeColor, ShapeType } from '../../types/board';
import {
  IconEdit,
  IconTrash,
  IconCopy,
  IconLink,
  IconUnlink,
  IconPalette,
} from '../Icons/Icons';
import { getShapeDefinition, getAllShapeDefinitions } from './shapeRegistry';
import './ShapeFormatBar.css';

export const ShapeFormatBar: React.FC = () => {
  const {
    shapes,
    connectors,
    selectedIds,
    viewport,
    editingShapeId,
    updateShape,
    deleteShape,
    addShape,
    setEditingShapeId,
    setActiveTool,
    setConnectingFromId,
    unlinkCard,
  } = useBoardStore();

  const [showColors, setShowColors] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  if (selectedIds.length !== 1 || editingShapeId) return null;

  const selectedShape = shapes.find((s) => s.id === selectedIds[0]);
  if (!selectedShape) return null;

  const hasConnections = connectors.some(
    (c) => c.fromCardId === selectedShape.id || c.toCardId === selectedShape.id
  );

  const scale = viewport.scale;
  const screenX = selectedShape.x * scale + viewport.x;
  const screenY = selectedShape.y * scale + viewport.y;
  const scaledWidth = selectedShape.width * scale;

  const left = screenX + scaledWidth / 2;
  const top = Math.max(16, screenY - 52);

  const handleDuplicate = () => {
    const newId = addShape(
      selectedShape.type,
      selectedShape.x + 30,
      selectedShape.y + 30,
      selectedShape.width,
      selectedShape.height,
      selectedShape.color,
      selectedShape.text
    );
    useBoardStore.getState().setSelectedIds([newId]);
  };

  const handleConnect = () => {
    setActiveTool('connector');
    setConnectingFromId(selectedShape.id);
  };

  const handleColorSelect = (color: ShapeColor) => {
    updateShape(selectedShape.id, { color });
    setShowColors(false);
  };

  const handleTypeSelect = (type: ShapeType) => {
    updateShape(selectedShape.id, { type });
    setShowTypePicker(false);
  };

  const currentDef = getShapeDefinition(selectedShape.type);
  const CurrentIcon = currentDef.icon;
  const shapeColors = SHAPE_COLORS[selectedShape.color] || SHAPE_COLORS.cream;

  return (
    <div
      className="shape-format-bar"
      style={{ left: `${left}px`, top: `${top}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Shape Type Switcher Toggle */}
      <button
        className={`shape-format-btn ${showTypePicker ? 'active' : ''}`}
        onClick={() => {
          setShowTypePicker(!showTypePicker);
          setShowColors(false);
        }}
        title={`Change shape type (current: ${currentDef.label})`}
      >
        <CurrentIcon size={16} />
      </button>

      {/* Quick Color Swatches Toggle */}
      <button
        className={`shape-format-btn ${showColors ? 'active' : ''}`}
        onClick={() => {
          setShowColors(!showColors);
          setShowTypePicker(false);
        }}
        title="Change Color"
      >
        <span
          className="shape-dot-indicator"
          style={{ backgroundColor: shapeColors.border }}
        />
        <IconPalette size={16} />
      </button>

      {/* Edit text label */}
      <button
        className="shape-format-btn"
        onClick={() => setEditingShapeId(selectedShape.id)}
        title="Edit text"
      >
        <IconEdit size={16} />
      </button>

      {/* Connect */}
      <button
        className="shape-format-btn"
        onClick={handleConnect}
        title="Connect line"
      >
        <IconLink size={16} />
      </button>

      {/* Unlink */}
      {hasConnections && (
        <button
          className="shape-format-btn danger"
          onClick={() => unlinkCard(selectedShape.id)}
          title="Remove all connections"
        >
          <IconUnlink size={16} />
        </button>
      )}

      {/* Duplicate */}
      <button
        className="shape-format-btn"
        onClick={handleDuplicate}
        title="Duplicate"
      >
        <IconCopy size={16} />
      </button>

      <div className="shape-format-divider" />

      {/* Delete */}
      <button
        className="shape-format-btn danger"
        onClick={() => deleteShape(selectedShape.id)}
        title="Delete shape"
      >
        <IconTrash size={16} />
      </button>

      {/* Shape Type Picker Popover */}
      {showTypePicker && (
        <div className="shape-type-popover">
          {getAllShapeDefinitions().map((def) => {
            const DefIcon = def.icon;
            return (
              <button
                key={def.type}
                className={`shape-type-swatch-btn ${selectedShape.type === def.type ? 'selected' : ''}`}
                onClick={() => handleTypeSelect(def.type)}
                title={def.label}
              >
                <DefIcon size={18} />
                <span>{def.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Color Palette Popover */}
      {showColors && (
        <div className="shape-color-popover">
          {(Object.keys(SHAPE_COLORS) as ShapeColor[]).map((colorKey) => (
            <button
              key={colorKey}
              className={`shape-swatch-btn ${selectedShape.color === colorKey ? 'selected' : ''}`}
              style={{
                backgroundColor: SHAPE_COLORS[colorKey].bg === 'transparent' ? '#ffffff' : SHAPE_COLORS[colorKey].bg,
                borderColor: SHAPE_COLORS[colorKey].border,
              }}
              onClick={() => handleColorSelect(colorKey)}
              title={colorKey}
            >
              <span
                className="shape-swatch-pin"
                style={{ backgroundColor: SHAPE_COLORS[colorKey].border }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
