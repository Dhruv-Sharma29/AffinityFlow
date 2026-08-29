import React, { useEffect, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import './TextEditor.css';

const DEFAULT_TEXT_COLOR = '#2b2420';
const TEXT_COLOR_NAMES: Record<string, string> = {
  '#2b2420': 'Ink',
  '#a3312b': 'Brick red',
  '#2f4a63': 'Slate blue',
  '#ffffff': 'White',
  '#000000': 'Black',
};

function getColorName(value: string): string {
  return TEXT_COLOR_NAMES[value.toLowerCase()] || 'Custom color';
}

function normalizeTextColor(value?: string): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : DEFAULT_TEXT_COLOR;
}

export const TextEditor: React.FC = () => {
  const { textItems, editingTextId, setEditingTextId, updateTextItem } = useBoardStore();
  const item = textItems.find(t => t.id === editingTextId);
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(22);
  const [color, setColor] = useState(DEFAULT_TEXT_COLOR);
  useEffect(() => { if (item) { setText(item.text); setFontSize(item.fontSize); setColor(normalizeTextColor(item.color)); } }, [item]);
  if (!item) return null;
  const save = () => { updateTextItem(item.id, { text, fontSize, color }); setEditingTextId(null); };
  return <div className="card-editor-overlay" onClick={save}><div className="card-editor" onClick={e => e.stopPropagation()}>
    <div className="card-editor-header"><span className="card-editor-label">Edit Text</span><button className="card-editor-close" onClick={save}>✕</button></div>
    <div className="card-editor-field"><label>Text</label><textarea autoFocus className="card-editor-textarea" rows={4} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') save(); e.stopPropagation(); }} /></div>
    <div className="card-editor-field"><label>Font size</label><input className="card-editor-input" type="number" min={8} max={96} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} /></div>
    <div className="card-editor-field"><label>Color</label><div className="text-color-control"><input className="text-color-picker" type="color" value={color} aria-label={`Text color: ${getColorName(color)}`} onChange={e => setColor(e.target.value)} /><div className="text-color-value"><span className="text-color-swatch" style={{ backgroundColor: color }} /><strong>{getColorName(color)}</strong><code>{color.toUpperCase()}</code></div></div></div>
    <button className="card-editor-save" onClick={save}>Save &amp; Close</button>
  </div></div>;
};
