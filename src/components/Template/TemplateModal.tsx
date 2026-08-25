import React, { useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { BOARD_TEMPLATES } from '../../data/templates';
import type { BoardTemplate } from '../../types/board';
import {
  IconTemplate,
  IconInvestigate,
  IconAffinityMap,
  IconRootCause,
  IconSwotMatrix,
} from '../Icons/Icons';
import './TemplateModal.css';

/** Map template icon id → SVG component */
const TEMPLATE_ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  investigate: IconInvestigate,
  affinity: IconAffinityMap,
  rootcause: IconRootCause,
  swot: IconSwotMatrix,
};

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose }) => {
  const { importFromJSON, zoomToFit } = useBoardStore();
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate>(BOARD_TEMPLATES[0]);

  if (!isOpen) return null;

  const handleLoad = () => {
    if (!selectedTemplate) return;
    importFromJSON(selectedTemplate.state);
    setTimeout(() => {
      zoomToFit();
    }, 100);
    onClose();
  };

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div className="template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-modal-tape" />

        <div className="template-modal-header">
          <div className="template-modal-header-left">
            <span className="template-modal-header-icon">
              <IconTemplate size={22} />
            </span>
            <h2 className="template-modal-title">Sensemaking Templates</h2>
          </div>
          <button className="template-modal-close" onClick={onClose} title="Close (Esc)">✕</button>
        </div>

        <div className="template-modal-content">
          <p className="template-modal-subtitle">
            Jumpstart your sensemaking session with structured affinity boards, investigative evidence webs, and causal analysis layouts.
          </p>

          <div className="template-grid">
            {BOARD_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate.id === tmpl.id;
              const cardCount = tmpl.state.cards.length;
              const shapeCount = tmpl.state.shapes.length;
              const connCount = tmpl.state.connectors.length;
              const groupCount = tmpl.state.clusters.length;

              const TemplateIcon = TEMPLATE_ICON_MAP[tmpl.icon] || IconTemplate;

              return (
                <div
                  key={tmpl.id}
                  className={`template-card ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedTemplate(tmpl)}
                  onDoubleClick={handleLoad}
                >
                  <div className="template-card-top">
                    <div className="template-card-icon-title">
                      <span className="template-card-icon">
                        <TemplateIcon size={22} />
                      </span>
                      <span className="template-card-name">{tmpl.name}</span>
                    </div>
                    <span className="template-card-category">{tmpl.category}</span>
                  </div>
                  <p className="template-card-desc">{tmpl.description}</p>
                  <div className="template-card-stats">
                    <span>{cardCount} cards</span>
                    <span>·</span>
                    <span>{shapeCount} shapes</span>
                    <span>·</span>
                    <span>{connCount} connections</span>
                    <span>·</span>
                    <span>{groupCount} groups</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="template-modal-actions">
          <button className="template-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="template-btn-load" onClick={handleLoad}>
            <span>Load Template</span>
            <span>↵</span>
          </button>
        </div>
      </div>
    </div>
  );
};
