import React, { useEffect, useState, useRef } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { CLUSTER_COLORS } from '../../types/board';
import type { ClusterColor } from '../../types/board';
import { IconGroup, IconTrash, IconUnlink, IconStickyNote } from '../Icons/Icons';
import './ClusterEditor.css';

const SUGGESTED_LABELS = [
  'Pain Points',
  'Opportunities',
  'Physical Evidence',
  'Delighters',
  'Architecture',
  'System Logs',
  'Next Steps',
  'Themes',
];

export const ClusterEditor: React.FC = () => {
  const {
    clusters,
    editingClusterId,
    setEditingClusterId,
    updateCluster,
    openConfirmDeleteCluster,
    ungroup,
    addCardToCluster,
  } = useBoardStore();

  const cluster = clusters.find(c => c.id === editingClusterId);
  const [label, setLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState<ClusterColor>('slate');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cluster) {
      setLabel(cluster.label || '');
      setSelectedColor(cluster.color || 'slate');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [cluster]);

  if (!editingClusterId || !cluster) return null;

  const handleSave = () => {
    const trimmed = label.trim() || 'Untitled Group';
    updateCluster(cluster.id, { label: trimmed, color: selectedColor });
    setEditingClusterId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditingClusterId(null);
    }
  };

  const handleColorSelect = (color: ClusterColor) => {
    setSelectedColor(color);
    updateCluster(cluster.id, { color });
  };

  const handleAddCard = () => {
    addCardToCluster(cluster.id);
    setEditingClusterId(null);
  };

  return (
    <div className="cluster-editor-overlay" onClick={handleSave}>
      <div className="cluster-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cluster-editor-tape" />

        <div className="cluster-editor-header">
          <div className="cluster-editor-header-title">
            <span className="cluster-editor-icon">
              <IconGroup size={20} />
            </span>
            <h3>Edit Group Container</h3>
          </div>
          <button className="cluster-editor-close" onClick={handleSave} title="Save & Close (Esc)">
            ✕
          </button>
        </div>

        <div className="cluster-editor-body">
          {/* Label input */}
          <div className="cluster-editor-field">
            <label className="cluster-editor-label">Group Label</label>
            <input
              ref={inputRef}
              type="text"
              className="cluster-editor-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Pain Points, Physical Evidence..."
              maxLength={40}
            />
          </div>

          {/* Quick preset suggestions */}
          <div className="cluster-editor-field">
            <label className="cluster-editor-label">Suggestions</label>
            <div className="cluster-editor-tags">
              {SUGGESTED_LABELS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="cluster-editor-tag-btn"
                  onClick={() => {
                    setLabel(tag);
                    updateCluster(cluster.id, { label: tag });
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Color Picker */}
          <div className="cluster-editor-field">
            <label className="cluster-editor-label">Theme Color</label>
            <div className="cluster-editor-colors">
              {(Object.keys(CLUSTER_COLORS) as ClusterColor[]).map((c) => {
                const theme = CLUSTER_COLORS[c];
                const isActive = selectedColor === c;
                return (
                  <button
                    key={c}
                    type="button"
                    className={`cluster-editor-color-btn ${isActive ? 'active' : ''}`}
                    style={{
                      backgroundColor: theme.badgeBg,
                      borderColor: isActive ? '#c0392b' : theme.border,
                    }}
                    onClick={() => handleColorSelect(c)}
                    title={c}
                  >
                    {isActive && <span className="cluster-editor-color-check">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="cluster-editor-footer">
          <div className="cluster-editor-footer-left">
            <button
              type="button"
              className="cluster-editor-btn-secondary"
              onClick={handleAddCard}
              title="Add a new card inside this group"
            >
              <IconStickyNote size={15} />
              <span>+ Add Card</span>
            </button>
            <button
              type="button"
              className="cluster-editor-btn-secondary"
              onClick={() => {
                ungroup(cluster.id);
                setEditingClusterId(null);
              }}
              title="Remove grouping box without deleting cards"
            >
              <IconUnlink size={15} />
              <span>Ungroup</span>
            </button>
            <button
              type="button"
              className="cluster-editor-btn-danger"
              onClick={() => {
                setEditingClusterId(null);
                openConfirmDeleteCluster(cluster.id);
              }}
              title="Delete group"
            >
              <IconTrash size={15} />
            </button>
          </div>

          <button
            type="button"
            className="cluster-editor-btn-save"
            onClick={handleSave}
          >
            Done ↵
          </button>
        </div>
      </div>
    </div>
  );
};
