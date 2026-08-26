import React, { useEffect } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { CARD_COLORS } from '../../types/board';
import './CardDetailModal.css';

export const CardDetailModal: React.FC = () => {
  const { cards, viewingCardId, setViewingCardId, setEditingCardId } = useBoardStore();

  const card = cards.find(c => c.id === viewingCardId);

  // Keyboard handling
  useEffect(() => {
    if (!viewingCardId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewingCardId(null);
      }
      // Enter or E to edit
      if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleEdit();
      }
      e.stopPropagation();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [viewingCardId]);

  if (!card || !viewingCardId) return null;

  const colors = CARD_COLORS[card.color];

  const handleEdit = () => {
    setViewingCardId(null);
    setEditingCardId(viewingCardId);
  };

  const handleClose = () => {
    setViewingCardId(null);
  };

  // Format date nicely
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="card-detail-overlay" onClick={handleClose}>
      <div
        className="card-detail-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color stripe at top */}
        <div
          className="card-detail-stripe"
          style={{ background: `linear-gradient(90deg, ${colors.pin}, ${colors.pin}88)` }}
        />

        {/* Close button */}
        <button className="card-detail-close" onClick={handleClose} title="Close (Esc)">
          ✕
        </button>

        {/* Scrollable body */}
        <div
          className="card-detail-body"
          style={{ borderLeftColor: colors.pin }}
        >
          {/* Eyebrow / Category */}
          {card.eyebrow && (
            <div className="card-detail-eyebrow" style={{ color: colors.eyebrow }}>
              {card.eyebrow.toUpperCase()}
            </div>
          )}

          {/* Title */}
          <div className={`card-detail-title ${!card.title ? 'placeholder' : ''}`}>
            {card.title || 'Untitled card'}
          </div>

          {/* Body text */}
          {card.body ? (
            <>
              <div className="card-detail-divider" />
              <div className="card-detail-text">
                {card.body}
              </div>
            </>
          ) : (
            <div className="card-detail-empty">
              No additional details. Click Edit to add content.
            </div>
          )}

          {/* Metadata */}
          <div className="card-detail-meta">
            <span>Created {formatDate(card.createdAt)}</span>
            {card.updatedAt !== card.createdAt && (
              <>
                <span className="card-detail-meta-dot" />
                <span>Updated {formatDate(card.updatedAt)}</span>
              </>
            )}
          </div>
        </div>

        {/* Footer with actions */}
        <div className="card-detail-footer">
          <button className="card-detail-edit-btn" onClick={handleEdit}>
            ✎ Edit Card
            <span className="card-detail-edit-shortcut">Enter</span>
          </button>
          <button className="card-detail-close-btn" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
