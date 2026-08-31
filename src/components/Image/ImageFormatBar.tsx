import React, { useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import type { ShapeType } from '../../types/board';
import { IconCopy, IconTrash } from '../Icons/Icons';
import { getAllShapeDefinitions, getShapeDefinition } from '../Shape/shapeRegistry';
import '../Shape/ShapeFormatBar.css';

export const ImageFormatBar: React.FC = () => {
  const { images, selectedIds, viewport, updateImage, deleteImage, addImage } = useBoardStore();
  const [showShapePicker, setShowShapePicker] = useState(false);

  if (selectedIds.length !== 1) return null;
  const selectedImage = images.find(image => image.id === selectedIds[0]);
  if (!selectedImage) return null;

  const screenX = selectedImage.x * viewport.scale + viewport.x;
  const screenY = selectedImage.y * viewport.scale + viewport.y;
  const left = screenX + selectedImage.width * viewport.scale / 2;
  const top = Math.max(16, screenY - 52);
  const currentDefinition = getShapeDefinition(selectedImage.shape);
  const CurrentIcon = currentDefinition.icon;

  const handleShapeSelect = (shape: ShapeType) => {
    updateImage(selectedImage.id, { shape });
    setShowShapePicker(false);
  };

  const handleDuplicate = () => {
    const newId = addImage(selectedImage.src, selectedImage.name, selectedImage.x + 30, selectedImage.y + 30, selectedImage.width, selectedImage.height, selectedImage.shape);
    useBoardStore.getState().setSelectedIds([newId]);
  };

  return (
    <div className="shape-format-bar" style={{ left: `${left}px`, top: `${top}px` }} onClick={event => event.stopPropagation()}>
      <button className={`shape-format-btn ${showShapePicker ? 'active' : ''}`} onClick={() => setShowShapePicker(open => !open)} title={`Change image shape (current: ${currentDefinition.label})`}>
        <CurrentIcon size={16} />
      </button>
      <button className="shape-format-btn" onClick={handleDuplicate} title="Duplicate image"><IconCopy size={16} /></button>
      <div className="shape-format-divider" />
      <button className="shape-format-btn danger" onClick={() => deleteImage(selectedImage.id)} title="Delete image"><IconTrash size={16} /></button>

      {showShapePicker && (
        <div className="shape-type-popover">
          {getAllShapeDefinitions().map(definition => {
            const DefinitionIcon = definition.icon;
            return <button key={definition.type} className={`shape-type-swatch-btn ${selectedImage.shape === definition.type ? 'selected' : ''}`} onClick={() => handleShapeSelect(definition.type)} title={definition.label}><DefinitionIcon size={18} /><span>{definition.label}</span></button>;
          })}
        </div>
      )}
    </div>
  );
};
