import React, { useEffect } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { IconTrash, IconUnlink } from '../Icons/Icons';
import './ConfirmDeleteModal.css';

export const ConfirmDeleteModal: React.FC = () => {
  const {
    confirmDeleteCluster,
    closeConfirmDeleteCluster,
    ungroup,
    deleteClusterWithContents,
    deleteCluster,
  } = useBoardStore();

  useEffect(() => {
    if (!confirmDeleteCluster?.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeConfirmDeleteCluster();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDeleteCluster, closeConfirmDeleteCluster]);

  if (!confirmDeleteCluster?.isOpen) return null;

  const { clusterId, clusterLabel, cardCount } = confirmDeleteCluster;

  const handleUngroup = () => {
    ungroup(clusterId);
    closeConfirmDeleteCluster();
  };

  const handleDeleteAll = () => {
    deleteClusterWithContents(clusterId);
    closeConfirmDeleteCluster();
  };

  const handleDeleteGroupOnly = () => {
    deleteCluster(clusterId);
    closeConfirmDeleteCluster();
  };

  return (
    <div className="confirm-delete-overlay" onClick={closeConfirmDeleteCluster}>
      <div className="confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-delete-tape" />

        <div className="confirm-delete-header">
          <div className="confirm-delete-icon-wrap">
            <IconTrash size={22} />
          </div>
          <div>
            <h3 className="confirm-delete-title">Delete Group Container?</h3>
            <p className="confirm-delete-target">"{clusterLabel}"</p>
          </div>
        </div>

        <div className="confirm-delete-body">
          {cardCount > 0 ? (
            <p>
              This group contains <strong>{cardCount} card{cardCount > 1 ? 's' : ''} / item{cardCount > 1 ? 's' : ''}</strong>. What would you like to do?
            </p>
          ) : (
            <p>
              Are you sure you want to delete this empty group container?
            </p>
          )}
        </div>

        <div className="confirm-delete-actions">
          <button
            className="confirm-btn-cancel"
            onClick={closeConfirmDeleteCluster}
          >
            Cancel
          </button>

          {cardCount > 0 && (
            <button
              className="confirm-btn-ungroup"
              onClick={handleUngroup}
              title="Remove grouping box but keep all cards in place"
            >
              <IconUnlink size={16} />
              <span>Ungroup (Keep Cards)</span>
            </button>
          )}

          {cardCount > 0 ? (
            <button
              className="confirm-btn-danger"
              onClick={handleDeleteAll}
              title="Delete group container and all cards inside it"
            >
              <IconTrash size={16} />
              <span>Delete Everything</span>
            </button>
          ) : (
            <button
              className="confirm-btn-danger"
              onClick={handleDeleteGroupOnly}
            >
              <IconTrash size={16} />
              <span>Delete Group</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
