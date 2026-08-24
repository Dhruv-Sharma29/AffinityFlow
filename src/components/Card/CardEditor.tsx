import React, { useRef, useEffect, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { CARD_COLORS } from '../../types/board';
import type { CardColor } from '../../types/board';
import './CardEditor.css';

export const CardEditor: React.FC = () => {
  const { cards, editingCardId, setEditingCardId, updateCard, deleteCard, viewport } = useBoardStore();

  const card = cards.find(c => c.id === editingCardId);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [eyebrow, setEyebrow] = useState('');
  const [color, setColor] = useState<CardColor>('cream');

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setBody(card.body);
      setEyebrow(card.eyebrow);
      setColor(card.color);
      // Focus title field after a frame
      requestAnimationFrame(() => {
        titleRef.current?.focus();
        titleRef.current?.select();
      });
    }
  }, [card]);

  if (!card || !editingCardId) return null;

  // Position the editor near the card
  const editorX = card.x * viewport.scale + viewport.x + card.width * viewport.scale + 16;
  const editorY = card.y * viewport.scale + viewport.y - 20;

  // Clamp to viewport
  const clampedX = Math.min(editorX, window.innerWidth - 340);
  const clampedY = Math.max(16, Math.min(editorY, window.innerHeight - 420));

  const handleSave = () => {
    updateCard(editingCardId, { title, body, eyebrow, color });
    setEditingCardId(null);
  };

  const handleDelete = () => {
    deleteCard(editingCardId);
    setEditingCardId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleSave();
    }
    // Ctrl/Cmd + Enter to save
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
    // Stop propagation so canvas doesn't capture shortcuts
    e.stopPropagation();
  };

  return (
    <div className="card-editor-overlay" onClick={handleSave}>
      <div
        className="card-editor"
        style={{
          left: clampedX,
          top: clampedY,
          borderLeftColor: CARD_COLORS[color].pin,
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Tape decoration */}
        <div className="card-editor-tape" />

        <div className="card-editor-header">
          <span className="card-editor-label">Edit Card</span>
          <div className="card-editor-actions">
            <button className="card-editor-delete" onClick={handleDelete} title="Delete card">
              🗑
            </button>
            <button className="card-editor-close" onClick={handleSave} title="Save & close (Esc)">
              ✕
            </button>
          </div>
        </div>

        {/* Eyebrow / category */}
        <div className="card-editor-field">
          <label>Category</label>
          <input
            type="text"
            value={eyebrow}
            onChange={(e) => setEyebrow(e.target.value)}
            placeholder="e.g. Observation, Pain Point, Insight…"
            className="card-editor-input"
          />
        </div>

        {/* Title */}
        <div className="card-editor-field">
          <label>Title</label>
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title…"
            className="card-editor-textarea card-editor-title-input"
            rows={2}
          />
        </div>

        {/* Body */}
        <div className="card-editor-field">
          <label>Details</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Additional notes, quotes, evidence…"
            className="card-editor-textarea"
            rows={4}
          />
        </div>

        {/* Color picker */}
        <div className="card-editor-field">
          <label>Color</label>
          <div className="card-editor-colors">
            {(Object.keys(CARD_COLORS) as CardColor[]).map((c) => (
              <button
                key={c}
                className={`card-editor-color-swatch ${color === c ? 'active' : ''}`}
                style={{ backgroundColor: CARD_COLORS[c].bg, borderColor: CARD_COLORS[c].border }}
                onClick={() => setColor(c)}
                title={c}
              >
                {color === c && <span className="card-editor-color-check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button className="card-editor-save" onClick={handleSave}>
          Save &amp; Close
          <span className="card-editor-shortcut">Esc</span>
        </button>
      </div>
    </div>
  );
};
