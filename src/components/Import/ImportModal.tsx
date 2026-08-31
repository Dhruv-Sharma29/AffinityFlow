import React, { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { parseBoardImport, type ParsedImport } from '../../utils/importBoard';
import { normalizeBoardState } from '../../utils/boardValidation';
import { IconImport, IconJson, IconText } from '../Icons/Icons';
import './ImportModal.css';

type ImportFormat = 'json' | 'csv' | 'markdown';
interface Props { isOpen: boolean; onClose: () => void; }
const OPTIONS: Array<{ id: ImportFormat; title: string; description: string; accept: string; icon: React.ReactNode }> = [
  { id: 'csv', title: 'CSV cards', description: 'Turn spreadsheet rows into sticky cards.', accept: '.csv', icon: <IconImport size={24} /> },
  { id: 'markdown', title: 'Markdown cards', description: 'Turn bullets and headings into sticky cards.', accept: '.md,.markdown,.txt', icon: <IconText size={24} /> },
  { id: 'json', title: 'JSON board', description: 'Restore a complete VisioSpace board backup.', accept: '.json', icon: <IconJson size={24} /> },
];

export const ImportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [format, setFormat] = useState<ImportFormat | null>(null);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [filename, setFilename] = useState('');
  const [fileError, setFileError] = useState('');
  const { importCards, importFromJSON, zoomToFit } = useBoardStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reset = () => { setFormat(null); setParsed(null); setFilename(''); setFileError(''); };
  const close = () => { reset(); onClose(); };
  const chooseFormat = (next: ImportFormat | null) => { setFormat(next); setParsed(null); setFilename(''); setFileError(''); if (fileInputRef.current) fileInputRef.current.value = ''; };
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const chooseFile = async (file?: File) => {
    if (!file || !format) return;
    setFilename(file.name);
    setFileError('');
    try {
      const contents = await file.text();
      if (format === 'json') {
        const data: unknown = JSON.parse(contents);
        const safeState = normalizeBoardState(data);
        if (!data || typeof data !== 'object' || !Array.isArray((data as { cards?: unknown }).cards)) throw new Error();
        const itemCount = safeState.cards.length + safeState.shapes.length + safeState.clusters.length + (safeState.textItems?.length || 0) + (safeState.voteDots?.length || 0);
        setParsed({ cards: [], warnings: [`JSON board is ready to restore${itemCount ? ` (${itemCount} items).` : '.'}`] });
      }
      else setParsed(parseBoardImport(contents, file.name));
    } catch { setParsed(null); setFileError('Invalid file. Please choose a valid VisioSpace board or import file.'); }
  };
  const importFile = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !format || !parsed) return;
    const contents = await file.text();
    if (format === 'json') importFromJSON(JSON.parse(contents));
    else importCards(parsed.cards);
    zoomToFit(); close();
  };
  return <div className="import-modal-overlay" onClick={close}><div className="import-modal" onClick={e => e.stopPropagation()}>
    <div className="import-modal-tape" /><div className="import-modal-header"><div className="import-modal-header-left"><span className="import-modal-header-icon"><IconImport size={22} /></span><h2 className="import-modal-title">Import</h2></div><button className="import-modal-close" onClick={close}>✕</button></div>
    {!format ? <div className="import-modal-content"><p className="import-modal-subtitle">Choose what you want to bring into your VisioSpace board.</p><div className="import-grid">{OPTIONS.map(option => <button key={option.id} className="import-card" onClick={() => chooseFormat(option.id)}><span className="import-card-icon">{option.icon}</span><span className="import-card-title">{option.title}</span><span className="import-card-description">{option.description}</span><span className="import-card-action">Choose format →</span></button>)}</div></div> : <div className="import-modal-content"><button className="import-back" onClick={() => chooseFormat(null)}>← Back to formats</button><p className="import-modal-subtitle">Select a file to preview before importing.</p><label className="import-file-picker"><span>Choose file</span><input ref={fileInputRef} className="import-file-input" type="file" accept={OPTIONS.find(o => o.id === format)?.accept} onChange={e => chooseFile(e.target.files?.[0])} /></label>{filename && <p className="import-filename">{filename}</p>}{fileError && <p className="import-error">{fileError}</p>}{parsed && format === 'json' && <div className="import-ready">✓ JSON board is ready to restore.</div>}{parsed && format !== 'json' && <><p className="import-count">{parsed.cards.length} cards ready to import.</p>{parsed.warnings.map(w => <p key={w} className="import-warning">{w}</p>)}<div className="import-preview">{parsed.cards.slice(0, 8).map((card, i) => <div key={i} className="import-preview-row"><strong>{card.title}</strong>{card.body && <span> — {card.body}</span>}</div>)}{parsed.cards.length > 8 && <div className="import-preview-row">…and {parsed.cards.length - 8} more</div>}</div></>}</div>}
    <div className="import-modal-actions"><button className="import-btn-cancel" onClick={close}>Cancel</button>{format && <button className="import-btn-primary" disabled={!parsed || (format !== 'json' && !parsed.cards.length)} onClick={importFile}>Import {format === 'json' ? 'board' : `${parsed?.cards.length || ''} cards`}</button>}</div>
  </div></div>;
};
