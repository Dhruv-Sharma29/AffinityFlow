<<<<<<< HEAD
import React from 'react';
=======
import React, { useState } from 'react';
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
import { useBoardStore } from '../../store/boardStore';
import { CLUSTER_COLORS } from '../../types/board';
import type { ClusterColor } from '../../types/board';
import {
  IconEdit,
<<<<<<< HEAD
  IconCopy,
  IconUnlink,
  IconTrash,
  IconStickyNote,
=======
  IconTrash,
  IconCopy,
  IconPalette,
  IconUnlink,
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
} from '../Icons/Icons';
import './ClusterFormatBar.css';

export const ClusterFormatBar: React.FC = () => {
  const {
    clusters,
    selectedIds,
    viewport,
<<<<<<< HEAD
    updateCluster,
    duplicateCluster,
    ungroup,
    openConfirmDeleteCluster,
    setEditingClusterId,
    addCardToCluster,
  } = useBoardStore();

  if (selectedIds.length !== 1) return null;

  const cluster = clusters.find(c => c.id === selectedIds[0]);
  if (!cluster) return null;

  // Convert canvas world coordinates to screen coordinates
  const screenX = cluster.x * viewport.scale + viewport.x;
  const screenY = cluster.y * viewport.scale + viewport.y;

  const handleColorSelect = (color: ClusterColor) => {
    updateCluster(cluster.id, { color });
  };

  const handleAddCard = () => {
    addCardToCluster(cluster.id);
  };
=======
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
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828

  return (
    <div
      className="cluster-format-bar"
<<<<<<< HEAD
      style={{
        left: `${screenX + (cluster.width * viewport.scale) / 2}px`,
        top: `${screenY - 48}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Quick "+ Card" button */}
      <button
        className="cluster-format-btn primary"
        onClick={handleAddCard}
        title="Add new card inside this group"
      >
        <IconStickyNote size={15} />
        <span>+ Card</span>
      </button>

      <div className="cluster-format-divider" />

      {/* Color swatches */}
      <div className="cluster-format-colors">
        {(Object.keys(CLUSTER_COLORS) as ClusterColor[]).map((c) => {
          const theme = CLUSTER_COLORS[c];
          const isSelected = cluster.color === c || (!cluster.color && c === 'slate');
          return (
            <button
              key={c}
              className={`cluster-color-btn ${isSelected ? 'active' : ''}`}
              style={{
                backgroundColor: theme.badgeBg,
                borderColor: isSelected ? '#c0392b' : theme.border,
              }}
              onClick={() => handleColorSelect(c)}
              title={c}
            />
          );
        })}
      </div>

      <div className="cluster-format-divider" />

      {/* Edit label button */}
      <button
        className="cluster-format-btn"
        onClick={() => setEditingClusterId(cluster.id)}
        title="Edit Group Label & Theme"
=======
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
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
      >
        <IconEdit size={16} />
      </button>

<<<<<<< HEAD
      {/* Duplicate button */}
      <button
        className="cluster-format-btn"
        onClick={() => duplicateCluster(cluster.id)}
=======
      {/* Duplicate */}
      <button
        className="cluster-format-btn"
        onClick={handleDuplicate}
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
        title="Duplicate Group & Contents"
      >
        <IconCopy size={16} />
      </button>

<<<<<<< HEAD
      {/* Ungroup button */}
      <button
        className="cluster-format-btn"
        onClick={() => ungroup(cluster.id)}
        title="Ungroup (Keep Cards)"
=======
      {/* Ungroup */}
      <button
        className="cluster-format-btn"
        onClick={handleUngroup}
        title="Ungroup (keep items inside)"
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
      >
        <IconUnlink size={16} />
      </button>

      <div className="cluster-format-divider" />

<<<<<<< HEAD
      {/* Delete button (with confirmation modal) */}
      <button
        className="cluster-format-btn danger"
        onClick={() => openConfirmDeleteCluster(cluster.id)}
        title="Delete Group"
      >
        <IconTrash size={16} />
      </button>
=======
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
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
    </div>
  );
};
