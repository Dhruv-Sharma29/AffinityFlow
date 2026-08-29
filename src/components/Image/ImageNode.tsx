import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Group, Image as KonvaImage, Rect, Shape as KonvaShape, Transformer } from 'react-konva';
import Konva from 'konva';
import type { ImageItem, ShapeType } from '../../types/board';
import { useBoardStore } from '../../store/boardStore';

interface ImageNodeProps {
  image: ImageItem;
  isSelected: boolean;
  onSelect: (id: string, e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, width: number, height: number, x: number, y: number, rotation: number) => void;
}

function drawShapePath(context: Konva.Context, type: ShapeType, width: number, height: number) {
  context.beginPath();
  switch (type) {
    case 'circle':
      context.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
      break;
    case 'triangle':
      context.moveTo(width / 2, 0);
      context.lineTo(width, height);
      context.lineTo(0, height);
      break;
    case 'diamond':
      context.moveTo(width / 2, 0);
      context.lineTo(width, height / 2);
      context.lineTo(width / 2, height);
      context.lineTo(0, height / 2);
      break;
    case 'hexagon':
      context.moveTo(width * 0.25, 0);
      context.lineTo(width * 0.75, 0);
      context.lineTo(width, height / 2);
      context.lineTo(width * 0.75, height);
      context.lineTo(width * 0.25, height);
      context.lineTo(0, height / 2);
      break;
    case 'star':
      for (let index = 0; index < 10; index += 1) {
        const angle = -Math.PI / 2 + index * Math.PI / 5;
        const radius = index % 2 === 0 ? Math.min(width, height) * 0.5 : Math.min(width, height) * 0.22;
        const x = width / 2 + Math.cos(angle) * radius;
        const y = height / 2 + Math.sin(angle) * radius;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      break;
    default:
      context.rect(0, 0, width, height);
  }
  context.closePath();
}

export const ImageNode: React.FC<ImageNodeProps> = ({ image, isSelected, onSelect, onDragStart, onDragEnd, onTransformEnd }) => {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const lastDragPos = useRef({ x: image.x, y: image.y });
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const imageElement = new window.Image();
    imageElement.onload = () => setLoadedImage(imageElement);
    imageElement.onerror = () => setLoadedImage(null);
    imageElement.src = image.src;
    return () => {
      imageElement.onload = null;
      imageElement.onerror = null;
    };
  }, [image.src]);

  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, image.width, image.height, image.rotation]);

  const handleDragStart = useCallback(() => {
    lastDragPos.current = { x: image.x, y: image.y };
    onDragStart(image.id);
  }, [image.id, image.x, image.y, onDragStart]);

  const handleDragMove = useCallback((event: Konva.KonvaEventObject<DragEvent>) => {
    const node = event.target;
    const store = useBoardStore.getState();
    if (store.selectedIds.includes(image.id) && store.selectedIds.length > 1) {
      const dx = node.x() - lastDragPos.current.x;
      const dy = node.y() - lastDragPos.current.y;
      lastDragPos.current = { x: node.x(), y: node.y() };
      store.moveMultipleItems(dx, dy, store.selectedIds.filter(id => id !== image.id));
    }
  }, [image.id]);

  const handleTransformEnd = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onTransformEnd(image.id, Math.max(40, Math.round(image.width * scaleX)), Math.max(40, Math.round(image.height * scaleY)), Math.round(node.x()), Math.round(node.y()), Math.round(node.rotation()));
  }, [image.id, image.width, image.height, onTransformEnd]);

  const clipFunc = useCallback((context: Konva.Context) => {
    drawShapePath(context, image.shape, image.width, image.height);
    context.clip();
  }, [image.shape, image.width, image.height]);

  const outlineScene = useCallback((context: Konva.Context, shape: Konva.Shape) => {
    drawShapePath(context, image.shape, image.width, image.height);
    context.strokeShape(shape);
  }, [image.shape, image.width, image.height]);

  return (
    <>
      <Group
        ref={groupRef}
        x={image.x}
        y={image.y}
        rotation={image.rotation}
        draggable
        clipFunc={clipFunc}
        onClick={event => onSelect(image.id, event)}
        onTap={event => onSelect(image.id, event as unknown as Konva.KonvaEventObject<MouseEvent>)}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={event => onDragEnd(image.id, event.target.x(), event.target.y())}
        onTransformEnd={handleTransformEnd}
        onContextMenu={event => {
          event.evt.preventDefault();
          window.dispatchEvent(new CustomEvent('canvas-context-menu', { detail: { clientX: event.evt.clientX, clientY: event.evt.clientY, targetId: image.id } }));
        }}
      >
        <Rect width={image.width} height={image.height} fill="#e7ded0" />
        {loadedImage && <KonvaImage image={loadedImage} width={image.width} height={image.height} />}
      </Group>
      <KonvaShape x={image.x} y={image.y} rotation={image.rotation} width={image.width} height={image.height} sceneFunc={outlineScene} stroke={isSelected ? '#a3312b' : 'rgba(43,36,32,.4)'} strokeWidth={isSelected ? 2 : 1} listening={false} />
      {isSelected && <Transformer ref={transformerRef} rotateEnabled borderStroke="#a3312b" anchorStroke="#a3312b" anchorFill="#fff" anchorSize={8} borderDash={[5, 4]} />}
    </>
  );
};
