import { useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { getGlobalStageRef } from '../../utils/stageRef';
import {
  exportToPdf,
  exportToPng,
  exportToSvg,
  exportToJson,
} from '../../utils/exportPdf';
import type { ExportFormat, ExportQuality, ExportOptions } from '../../utils/exportPdf';
import { IconPdf, IconPng, IconSvgFormat, IconJson, IconExport, IconWarning } from '../Icons/Icons';
import './ExportModal.css';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FORMAT_OPTIONS: { id: ExportFormat; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'pdf', label: 'PDF', icon: <IconPdf size={24} />, desc: 'Best for printing and sharing' },
  { id: 'png', label: 'PNG', icon: <IconPng size={24} />, desc: 'High-quality raster image' },
  { id: 'svg', label: 'SVG', icon: <IconSvgFormat size={24} />, desc: 'Scalable vector format' },
  { id: 'json', label: 'JSON', icon: <IconJson size={24} />, desc: 'Raw data for re-importing' },
];

const QUALITY_OPTIONS: { id: ExportQuality; label: string; desc: string }[] = [
  { id: 'standard', label: '1×', desc: 'Standard' },
  { id: 'high', label: '2×', desc: 'High (Retina)' },
  { id: 'ultra', label: '3×', desc: 'Ultra HD' },
];

const BG_OPTIONS = [
  { id: 'cork', label: 'Cork Board', color: '#b8804f' },
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'cream', label: 'Cream', color: '#f4ecd8' },
  { id: 'dark', label: 'Dark', color: '#241d18' },
  { id: 'transparent', label: 'Transparent', color: 'transparent' },
];

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { cards, shapes, connectors, clusters } = useBoardStore();

  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [quality, setQuality] = useState<ExportQuality>('high');
  const [title, setTitle] = useState('Affinity Board');
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [bgColor, setBgColor] = useState('#b8804f');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalItems = cards.length + shapes.length;

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    const options: ExportOptions = {
      format,
      quality,
      title,
      includeTitle,
      includeTimestamp,
      backgroundColor: bgColor,
      padding: 60,
    };

    try {
      if (format === 'json') {
        exportToJson(cards, shapes, connectors, clusters, options);
      } else {
        const stage = getGlobalStageRef();
        if (!stage) {
          throw new Error('Canvas not ready. Try again.');
        }

        switch (format) {
          case 'pdf':
            await exportToPdf(stage, cards, shapes, clusters, options);
            break;
          case 'png':
            exportToPng(stage, cards, shapes, clusters, options);
            break;
          case 'svg':
            exportToSvg(stage, cards, shapes, clusters, options);
            break;
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleExport();
    e.stopPropagation();
  };

  const isImageFormat = format !== 'json';

  return (
    <div className="export-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        {/* Tape decoration */}
        <div className="export-tape" />

        {/* Header */}
        <div className="export-header">
          <div className="export-header-left">
            <span className="export-header-icon"><IconExport size={24} /></span>
            <h2 className="export-title">Export Board</h2>
          </div>
          <button className="export-close" onClick={onClose}>✕</button>
        </div>

        {/* Board info */}
        <div className="export-info">
          <span className="export-info-item">{cards.length} card{cards.length !== 1 ? 's' : ''}</span>
          <span className="export-info-dot">·</span>
          <span className="export-info-item">{shapes.length} shape{shapes.length !== 1 ? 's' : ''}</span>
          <span className="export-info-dot">·</span>
          <span className="export-info-item">{connectors.length} connection{connectors.length !== 1 ? 's' : ''}</span>
          <span className="export-info-dot">·</span>
          <span className="export-info-item">{clusters.length} group{clusters.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Format selection */}
        <div className="export-section">
          <label className="export-label">Format</label>
          <div className="export-format-grid">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`export-format-btn ${format === opt.id ? 'active' : ''}`}
                onClick={() => setFormat(opt.id)}
              >
                <span className="export-format-icon">{opt.icon}</span>
                <span className="export-format-label">{opt.label}</span>
                <span className="export-format-desc">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="export-section">
          <label className="export-label">Board Title</label>
          <input
            type="text"
            className="export-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Affinity Board"
          />
        </div>

        {/* Quality (only for image formats) */}
        {isImageFormat && (
          <div className="export-section">
            <label className="export-label">Quality</label>
            <div className="export-quality-row">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  className={`export-quality-btn ${quality === opt.id ? 'active' : ''}`}
                  onClick={() => setQuality(opt.id)}
                >
                  <span className="export-quality-label">{opt.label}</span>
                  <span className="export-quality-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Background color (only for image formats) */}
        {isImageFormat && (
          <div className="export-section">
            <label className="export-label">Background</label>
            <div className="export-bg-row">
              {BG_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  className={`export-bg-btn ${bgColor === opt.color ? 'active' : ''}`}
                  onClick={() => setBgColor(opt.color)}
                  title={opt.label}
                >
                  <span
                    className="export-bg-swatch"
                    style={{
                      backgroundColor: opt.color === 'transparent' ? '#fff' : opt.color,
                      backgroundImage: opt.color === 'transparent'
                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                        : undefined,
                      backgroundSize: opt.color === 'transparent' ? '8px 8px' : undefined,
                      backgroundPosition: opt.color === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
                    }}
                  />
                  <span className="export-bg-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PDF-specific options */}
        {format === 'pdf' && (
          <div className="export-section">
            <label className="export-label">PDF Options</label>
            <div className="export-checkboxes">
              <label className="export-checkbox">
                <input
                  type="checkbox"
                  checked={includeTitle}
                  onChange={(e) => setIncludeTitle(e.target.checked)}
                />
                <span>Include title header</span>
              </label>
              <label className="export-checkbox">
                <input
                  type="checkbox"
                  checked={includeTimestamp}
                  onChange={(e) => setIncludeTimestamp(e.target.checked)}
                />
                <span>Include export timestamp</span>
              </label>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="export-error">
            <span style={{ display: 'flex' }}><IconWarning size={16} /></span> {error}
          </div>
        )}

        {/* Actions */}
        <div className="export-actions">
          <button className="export-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="export-submit-btn"
            onClick={handleExport}
            disabled={isExporting || totalItems === 0}
          >
            {isExporting ? (
              <>
                <span className="export-spinner" />
                Exporting…
              </>
            ) : (
              <>
                Export as {format.toUpperCase()}
                <kbd>⌘↵</kbd>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

