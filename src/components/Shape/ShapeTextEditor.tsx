import React, { useRef, useEffect, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { SHAPE_COLORS } from '../../types/board';
import type { ShapeColor, ShapeType } from '../../types/board';
import { getAllShapeDefinitions } from './shapeRegistry';
import { IconTrash } from '../Icons/Icons';
import './ShapeTextEditor.css';

export const ShapeTextEditor: React.FC = () => {
  const {
    shapes,
    editingShapeId,
    setEditingShapeId,
    updateShape,
    deleteShape,
    viewport,
  } = useBoardStore();

  const shape = shapes.find((s) => s.id === editingShapeId);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [color, setColor] = useState<ShapeColor>('cream');
  const [shapeType, setShapeType] = useState<ShapeType>('rectangle');

  useEffect(() => {
    if (shape) {
      setText(shape.text || '');
      setColor(shape.color || 'cream');
      setShapeType(shape.type || 'rectangle');
      requestAnimationFrame(() => {
        textRef.current?.focus();
        textRef.current?.select();
      });
    }
  }, [shape]);

  if (!shape || !editingShapeId) return null;

  // Position near the shape
  const scale = viewport.scale;
  const editorX = shape.x * scale + viewport.x + shape.width * scale + 16;
  const editorY = shape.y * scale + viewport.y - 10;

  const clampedX = Math.min(editorX, window.innerWidth - 320);
  const clampedY = Math.max(16, Math.min(editorY, window.innerHeight - 380));

  const handleSave = () => {
    updateShape(editingShapeId, { text, color, type: shapeType });
    setEditingShapeId(null);
  };

  const handleDelete = () => {
    deleteShape(editingShapeId);
    setEditingShapeId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleSave();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
    e.stopPropagation();
  };

  const shapeDefs = getAllShapeDefinitions();

  return (
    <div className="shape-editor-overlay" onClick={handleSave}>
      <div
        className="shape-editor"
        style={{
          left: clampedX,
          top: clampedY,
          borderLeftColor: (SHAPE_COLORS[color] || SHAPE_COLORS.cream).border,
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="shape-editor-header">
          <span className="shape-editor-label">Edit Shape</span>
          <div className="shape-editor-actions">
            <button className="shape-editor-delete" onClick={handleDelete} title="Delete shape">
              <IconTrash size={16} />
            </button>
            <button className="shape-editor-close" onClick={handleSave} title="Save & close (Esc)">
              ✕
            </button>
          </div>
        </div>

        {/* Shape Type Selector */}
        <div className="shape-editor-field">
          <label>Shape Type</label>
          <div className="shape-editor-types">
            {shapeDefs.map((def) => {
              const Icon = def.icon;
              return (
                <button
                  key={def.type}
                  className={`shape-type-btn ${shapeType === def.type ? 'active' : ''}`}
                  onClick={() => setShapeType(def.type)}
                  title={def.label}
                >
                  <Icon size={16} />
                  <span>{def.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Label */}
        <div className="shape-editor-field">
          <label>Label</label>
          <textarea
            ref={textRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type label text…"
            className="shape-editor-textarea"
            rows={3}
          />
        </div>

        {/* Color Palette */}
        <div className="shape-editor-field">
          <label>Color</label>
          <div className="shape-editor-colors">
            {(Object.keys(SHAPE_COLORS) as ShapeColor[]).map((c) => (
              <button
                key={c}
                className={`shape-editor-color-swatch ${color === c ? 'active' : ''}`}
                style={{
                  backgroundColor: SHAPE_COLORS[c].bg === 'transparent' ? '#ffffff' : SHAPE_COLORS[c].bg,
                  borderColor: SHAPE_COLORS[c].border,
                }}
                onClick={() => setColor(c)}
                title={c}
              >
                {color === c && <span className="shape-editor-color-check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button className="shape-editor-save" onClick={handleSave}>
          Done
          <span className="shape-editor-shortcut">Esc</span>
        </button>
      </div>
    </div>
  );
};
