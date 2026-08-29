import React, { useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { CLUSTER_COLORS } from '../../types/board';
import type { ClusterColor } from '../../types/board';
import {
  IconEdit,
  IconTrash,
  IconCopy,
  IconPalette,
  IconUnlink,
} from '../Icons/Icons';
import './ClusterFormatBar.css';

export const ClusterFormatBar: React.FC = () => {
  const {
    clusters,
    selectedIds,
    viewport,
    editingClusterId,
    updateCluster,
    deleteCluster,
    duplicateCluster,
    ungroup,
    setEditingClusterId,
  } = useBoardStore();

  const [showColors, setShowColors] = useState(false);

  if (selectedIds.length !== 1 || editingClusterId) return null;

  const selectedCluster = clusters.find((c) => c.id === selectedIds[0]);
  if (!selectedCluster) return null;

  const scale = viewport.scale;
  const screenX = selectedCluster.x * scale + viewport.x;
  const screenY = selectedCluster.y * scale + viewport.y;

  // Position above the top-left of the cluster (near the badge)
  const left = screenX + 60;
  const top = Math.max(16, screenY - 50);

  const handleDuplicate = () => {
    duplicateCluster(selectedCluster.id);
  };

  const handleUngroup = () => {
    ungroup(selectedCluster.id);
  };

  const handleColorSelect = (color: ClusterColor) => {
    updateCluster(selectedCluster.id, { color });
    setShowColors(false);
  };

  const theme = CLUSTER_COLORS[selectedCluster.color || 'slate'] || CLUSTER_COLORS.slate;

  return (
    <div
      className="cluster-format-bar"
      style={{ left: `${left}px`, top: `${top}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Quick Color Swatches Toggle */}
      <button
        className={`cluster-format-btn ${showColors ? 'active' : ''}`}
        onClick={() => setShowColors(!showColors)}
        title="Change Group Color Theme"
      >
        <span
          className="cluster-dot-indicator"
          style={{ backgroundColor: theme.badgeBg }}
        />
        <IconPalette size={16} />
      </button>

      {/* Edit label */}
      <button
        className="cluster-format-btn"
        onClick={() => setEditingClusterId(selectedCluster.id)}
        title="Edit Group Label & Settings"
      >
        <IconEdit size={16} />
      </button>

      {/* Duplicate */}
      <button
        className="cluster-format-btn"
        onClick={handleDuplicate}
        title="Duplicate Group & Contents"
      >
        <IconCopy size={16} />
      </button>

      {/* Ungroup */}
      <button
        className="cluster-format-btn"
        onClick={handleUngroup}
        title="Ungroup (keep items inside)"
      >
        <IconUnlink size={16} />
      </button>

      <div className="cluster-format-divider" />

      {/* Delete Group Container */}
      <button
        className="cluster-format-btn danger"
        onClick={() => deleteCluster(selectedCluster.id)}
        title="Delete Group container"
      >
        <IconTrash size={16} />
      </button>

      {/* Color Palette Popover */}
      {showColors && (
        <div className="cluster-color-popover">
          {(Object.keys(CLUSTER_COLORS) as ClusterColor[]).map((colorKey) => {
            const cTheme = CLUSTER_COLORS[colorKey];
            return (
              <button
                key={colorKey}
                className={`cluster-swatch-btn ${selectedCluster.color === colorKey ? 'selected' : ''}`}
                style={{
                  backgroundColor: cTheme.badgeBg,
                  borderColor: cTheme.border,
                }}
                onClick={() => handleColorSelect(colorKey)}
                title={colorKey}
              >
                <span
                  className="cluster-swatch-dot"
                  style={{ backgroundColor: cTheme.border }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
