import React, { useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { CARD_COLORS } from '../../types/board';
import type { CardColor } from '../../types/board';
import {
  IconEdit, IconTrash, IconCopy, IconLink, IconUnlink, IconPalette,
} from '../Icons/Icons';
import './FloatingFormatBar.css';

export const FloatingFormatBar: React.FC = () => {
  const {
    cards, connectors, selectedIds, viewport, editingCardId,
    updateCard, deleteCard, addCard, setEditingCardId,
    setActiveTool, setConnectingFromId, unlinkCard,
  } = useBoardStore();

  const [showColors, setShowColors] = useState(false);

  // Show only when exactly one card is selected and not in modal editing mode
  if (selectedIds.length !== 1 || editingCardId) return null;

  const selectedCard = cards.find(c => c.id === selectedIds[0]);
  if (!selectedCard) return null;

  const hasConnections = connectors.some(
    c => c.fromCardId === selectedCard.id || c.toCardId === selectedCard.id
  );

  // Calculate screen position centered above the card
  const scale = viewport.scale;
  const screenX = selectedCard.x * scale + viewport.x;
  const screenY = selectedCard.y * scale + viewport.y;
  const scaledWidth = selectedCard.width * scale;

  const left = screenX + scaledWidth / 2;
  const top = Math.max(16, screenY - 52);

  const handleDuplicate = () => {
    const newId = addCard(selectedCard.x + 30, selectedCard.y + 30, selectedCard.color);
    useBoardStore.getState().updateCard(newId, {
      title: selectedCard.title,
      body: selectedCard.body,
      eyebrow: selectedCard.eyebrow,
    });
    useBoardStore.getState().setSelectedIds([newId]);
  };

  const handleConnect = () => {
    setActiveTool('connector');
    setConnectingFromId(selectedCard.id);
  };

  const handleColorSelect = (color: CardColor) => {
    updateCard(selectedCard.id, { color });
    setShowColors(false);
  };

  return (
    <div
      className="floating-format-bar"
      style={{ left: `${left}px`, top: `${top}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Quick Color Swatches Toggle */}
      <button
        className={`floating-bar-btn ${showColors ? 'active' : ''}`}
        onClick={() => setShowColors(!showColors)}
        title="Change Color"
      >
        <span
          className="color-dot-indicator"
          style={{ backgroundColor: CARD_COLORS[selectedCard.color].pin }}
        />
        <IconPalette size={16} />
      </button>

      {/* Edit */}
      <button
        className="floating-bar-btn"
        onClick={() => setEditingCardId(selectedCard.id)}
        title="Edit text"
      >
        <IconEdit size={16} />
      </button>

      {/* Connect */}
      <button
        className="floating-bar-btn"
        onClick={handleConnect}
        title="Connect line"
      >
        <IconLink size={16} />
      </button>

      {/* Unlink */}
      {hasConnections && (
        <button
          className="floating-bar-btn danger"
          onClick={() => unlinkCard(selectedCard.id)}
          title="Remove all connections"
        >
          <IconUnlink size={16} />
        </button>
      )}

      {/* Duplicate */}
      <button
        className="floating-bar-btn"
        onClick={handleDuplicate}
        title="Duplicate"
      >
        <IconCopy size={16} />
      </button>

      <div className="floating-bar-divider" />

      {/* Delete */}
      <button
        className="floating-bar-btn danger"
        onClick={() => deleteCard(selectedCard.id)}
        title="Delete"
      >
        <IconTrash size={16} />
      </button>

      {/* Color Palette Popover */}
      {showColors && (
        <div className="floating-color-popover">
          {(Object.keys(CARD_COLORS) as CardColor[]).map((colorKey) => (
            <button
              key={colorKey}
              className={`color-swatch-btn ${selectedCard.color === colorKey ? 'selected' : ''}`}
              style={{
                backgroundColor: CARD_COLORS[colorKey].bg,
                borderColor: CARD_COLORS[colorKey].border,
              }}
              onClick={() => handleColorSelect(colorKey)}
              title={colorKey}
            >
              <span
                className="swatch-pin"
                style={{ backgroundColor: CARD_COLORS[colorKey].pin }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
