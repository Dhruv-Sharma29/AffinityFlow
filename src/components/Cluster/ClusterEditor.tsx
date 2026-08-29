<<<<<<< HEAD
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
=======
import React, { useRef, useEffect, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { CLUSTER_COLORS } from '../../types/board';
import type { ClusterColor } from '../../types/board';
import './ClusterEditor.css';

const QUICK_CLUSTER_NAMES = [
  'Physical Evidence',
  'Digital Logs',
  'Pain Points',
  'Opportunities',
  'Key Themes',
  'Architecture',
  'Sprint Goals',
  'User Flow',
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
];

export const ClusterEditor: React.FC = () => {
  const {
    clusters,
    editingClusterId,
    setEditingClusterId,
    updateCluster,
<<<<<<< HEAD
    openConfirmDeleteCluster,
    ungroup,
    addCardToCluster,
  } = useBoardStore();

  const cluster = clusters.find(c => c.id === editingClusterId);
  const [label, setLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState<ClusterColor>('slate');
  const inputRef = useRef<HTMLInputElement>(null);
=======
    ungroup,
    deleteClusterWithContents,
    viewport,
  } = useBoardStore();

  const cluster = clusters.find((c) => c.id === editingClusterId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState<ClusterColor>('slate');
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828

  useEffect(() => {
    if (cluster) {
      setLabel(cluster.label || '');
<<<<<<< HEAD
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

=======
      setColor(cluster.color || 'slate');
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [cluster]);

  if (!cluster || !editingClusterId) return null;

  // Position near cluster header
  const scale = viewport.scale;
  const editorX = cluster.x * scale + viewport.x + 20;
  const editorY = cluster.y * scale + viewport.y - 120;

  const clampedX = Math.max(16, Math.min(editorX, window.innerWidth - 320));
  const clampedY = Math.max(16, Math.min(editorY, window.innerHeight - 380));

  const handleSave = () => {
    updateCluster(editingClusterId, { label: label.trim() || 'Untitled Group', color });
    setEditingClusterId(null);
  };

  const handleUngroup = () => {
    ungroup(editingClusterId);
  };

  const handleDeleteAll = () => {
    deleteClusterWithContents(editingClusterId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleSave();
    }
    if (e.key === 'Enter') {
      handleSave();
    }
    e.stopPropagation();
  };

  const activeTheme = CLUSTER_COLORS[color] || CLUSTER_COLORS.slate;

  return (
    <div className="cluster-editor-overlay" onClick={handleSave}>
      <div
        className="cluster-editor"
        style={{
          left: clampedX,
          top: clampedY,
          borderLeftColor: activeTheme.badgeBg,
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="cluster-editor-header">
          <span className="cluster-editor-title">
            <span>🏷</span>
            <span>Edit Group</span>
          </span>
          <div className="cluster-editor-actions">
            <button
              className="cluster-editor-btn-action danger"
              onClick={handleDeleteAll}
              title="Delete group and all its contents"
            >
              🗑
            </button>
            <button
              className="cluster-editor-btn-action"
              onClick={handleSave}
              title="Save & close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Group Label Input */}
        <div className="cluster-editor-field">
          <label>Group Label</label>
          <input
            ref={inputRef}
            type="text"
            className="cluster-editor-input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Physical Evidence, Pain Points..."
            maxLength={40}
          />
        </div>

        {/* Quick Suggestion Tags */}
        <div className="cluster-editor-field">
          <label>Quick Suggestions</label>
          <div className="cluster-quick-tags">
            {QUICK_CLUSTER_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                className="cluster-quick-tag-btn"
                onClick={() => setLabel(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div className="cluster-editor-field">
          <label>Theme Color</label>
          <div className="cluster-editor-colors">
            {(Object.keys(CLUSTER_COLORS) as ClusterColor[]).map((cKey) => {
              const theme = CLUSTER_COLORS[cKey];
              return (
                <button
                  key={cKey}
                  type="button"
                  className={`cluster-color-swatch ${color === cKey ? 'active' : ''}`}
                  style={{
                    backgroundColor: theme.badgeBg,
                    borderColor: theme.border,
                  }}
                  onClick={() => setColor(cKey)}
                  title={cKey}
                >
                  {color === cKey && <span className="cluster-color-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="cluster-editor-footer">
          <button
            type="button"
            className="cluster-editor-btn-ungroup"
            onClick={handleUngroup}
            title="Break apart group container without deleting cards"
          >
            Ungroup
          </button>
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
          <button
            type="button"
            className="cluster-editor-btn-save"
            onClick={handleSave}
          >
<<<<<<< HEAD
            Done ↵
=======
            Done
            <span className="cluster-editor-shortcut">Esc</span>
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
          </button>
        </div>
      </div>
    </div>
  );
};
