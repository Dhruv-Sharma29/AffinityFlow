import React, { useState, useEffect, useCallback } from 'react';
import { Line, Circle } from 'react-konva';
import type Konva from 'konva';
import type { Card, Shape, Viewport } from '../../types/board';

interface ConnectorCreatorProps {
  fromItem: Card | Shape;
  stageRef: React.RefObject<Konva.Stage | null>;
  viewport: Viewport;
}

function getItemAnchor(item: Card | Shape): { x: number; y: number } {
  if ('title' in item) {
    return { x: item.x + item.width / 2, y: item.y - 6 };
  }
  return { x: item.x + item.width / 2, y: item.y };
}

export const ConnectorCreator: React.FC<ConnectorCreatorProps> = ({
  fromItem,
  stageRef,
  viewport,
}) => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const stage = stageRef.current;
      if (!stage) return;
      // Convert screen position to world position
      const x = (e.clientX - viewport.x) / viewport.scale;
      const y = (e.clientY - viewport.y) / viewport.scale;
      setMousePos({ x, y });
    },
    [stageRef, viewport]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  if (!mousePos) return null;

  const anchor = getItemAnchor(fromItem);
  const startX = anchor.x;
  const startY = anchor.y;

  // Compute droop
  const dx = mousePos.x - startX;
  const dy = mousePos.y - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const droop = Math.min(dist * 0.2, 60);

  const mx = (startX + mousePos.x) / 2;
  const my = (startY + mousePos.y) / 2 + droop;

  const points: number[] = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * mx + t * t * mousePos.x;
    const py = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * my + t * t * mousePos.y;
    points.push(px, py);
  }

  return (
    <>
      <Line
        points={points}
        stroke="#2f4a63"
        strokeWidth={2}
        opacity={0.6}
        dash={[6, 4]}
        lineCap="round"
        listening={false}
      />
      {/* End point indicator */}
      <Circle
        x={mousePos.x}
        y={mousePos.y}
        radius={6}
        fill="rgba(47, 74, 99, 0.3)"
        stroke="#2f4a63"
        strokeWidth={1.5}
        listening={false}
      />
    </>
  );
};

