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
];

export const ClusterEditor: React.FC = () => {
  const {
    clusters,
    editingClusterId,
    setEditingClusterId,
    updateCluster,
    ungroup,
    deleteClusterWithContents,
    viewport,
  } = useBoardStore();

  const cluster = clusters.find((c) => c.id === editingClusterId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState<ClusterColor>('slate');

  useEffect(() => {
    if (cluster) {
      setLabel(cluster.label || '');
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
          <button
            type="button"
            className="cluster-editor-btn-save"
            onClick={handleSave}
          >
            Done
            <span className="cluster-editor-shortcut">Esc</span>
          </button>
        </div>
      </div>
    </div>
  );
};
