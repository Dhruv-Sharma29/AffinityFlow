import React, { useState, useEffect, useRef } from 'react';
import { useBoardStore } from '../../store/boardStore';
import './ConnectorLabelEditor.css';

const QUICK_TAGS = [
  'supports',
  'contradicts',
  'causes',
  'leads to',
  'evidenced by',
  'timeline anchor',
  'unverified',
  'reinforces',
];

export const ConnectorLabelEditor: React.FC = () => {
  const { connectors, editingConnectorId, setEditingConnectorId, updateConnector } = useBoardStore();
  const [label, setLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConnector = connectors.find(c => c.id === editingConnectorId);

  useEffect(() => {
    if (activeConnector) {
      setLabel(activeConnector.label || '');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [activeConnector]);

  if (!editingConnectorId || !activeConnector) return null;

  const handleSave = () => {
    updateConnector(activeConnector.id, { label: label.trim() });
    setEditingConnectorId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingConnectorId(null);
    }
  };

  return (
    <div className="connector-editor-overlay" onClick={() => setEditingConnectorId(null)}>
      <div className="connector-editor-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="connector-editor-title">
          <span>🧵</span>
          <span>Edit Connection Label</span>
        </h3>

        <div className="connector-editor-field">
          <label className="connector-editor-label">Relationship Description</label>
          <input
            ref={inputRef}
            type="text"
            className="connector-editor-input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. contradicts, leads to, corroborates..."
            maxLength={40}
          />
        </div>

        <div className="connector-editor-field">
          <label className="connector-editor-label">Quick Suggestions</label>
          <div className="connector-quick-tags">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className="connector-quick-tag-btn"
                onClick={() => setLabel(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="connector-editor-actions">
          <button
            type="button"
            className="connector-btn-cancel"
            onClick={() => setEditingConnectorId(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="connector-btn-save"
            onClick={handleSave}
          >
            Save Label
          </button>
        </div>
      </div>
    </div>
  );
};
