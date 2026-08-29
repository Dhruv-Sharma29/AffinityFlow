import React from 'react';
import { useBoardStore } from '../../store/boardStore';
import { CLUSTER_COLORS } from '../../types/board';
import type { ClusterColor } from '../../types/board';
import {
  IconEdit,
  IconCopy,
  IconUnlink,
  IconTrash,
  IconStickyNote,
} from '../Icons/Icons';
import './ClusterFormatBar.css';

export const ClusterFormatBar: React.FC = () => {
  const {
    clusters,
    selectedIds,
    viewport,
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

  return (
    <div
      className="cluster-format-bar"
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
      >
        <IconEdit size={16} />
      </button>

      {/* Duplicate button */}
      <button
        className="cluster-format-btn"
        onClick={() => duplicateCluster(cluster.id)}
        title="Duplicate Group & Contents"
      >
        <IconCopy size={16} />
      </button>

      {/* Ungroup button */}
      <button
        className="cluster-format-btn"
        onClick={() => ungroup(cluster.id)}
        title="Ungroup (Keep Cards)"
      >
        <IconUnlink size={16} />
      </button>

      <div className="cluster-format-divider" />

      {/* Delete button (with confirmation modal) */}
      <button
        className="cluster-format-btn danger"
        onClick={() => openConfirmDeleteCluster(cluster.id)}
        title="Delete Group"
      >
        <IconTrash size={16} />
      </button>
    </div>
  );
};
