import React from 'react';
import { Line } from 'react-konva';
import type { Connector, Card } from '../../types/board';
import { CONNECTOR_COLORS } from '../../types/board';

interface ConnectorLineProps {
  connector: Connector;
  fromCard: Card;
  toCard: Card;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

// Compute catenary-like droopy curve between two pin points
function computeCurvePoints(
  x1: number, y1: number,
  x2: number, y2: number,
): number[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Droop amount proportional to distance
  const droop = Math.min(dist * 0.25, 80);

  // Midpoint
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + droop;

  // Use quadratic bezier approximation with multiple points
  const points: number[] = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic bezier: P = (1-t)²P0 + 2(1-t)tP1 + t²P2
    const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
    const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;
    points.push(px, py);
  }
  return points;
}

export const ConnectorLine: React.FC<ConnectorLineProps> = ({
  connector,
  fromCard,
  toCard,
  isSelected,
  onSelect,
}) => {
  // Pin positions (top center of each card)
  const x1 = fromCard.x + fromCard.width / 2;
  const y1 = fromCard.y - 6;
  const x2 = toCard.x + toCard.width / 2;
  const y2 = toCard.y - 6;

  const points = computeCurvePoints(x1, y1, x2, y2);
  const strokeColor = CONNECTOR_COLORS[connector.color];

  return (
    <>
      {/* Invisible wider line for easier click targeting */}
      <Line
        points={points}
        stroke="transparent"
        strokeWidth={16}
        onClick={() => onSelect(connector.id)}
        onTap={() => onSelect(connector.id)}
        hitStrokeWidth={20}
      />

      {/* Visible connector line */}
      <Line
        points={points}
        stroke={strokeColor}
        strokeWidth={isSelected ? 3 : 2}
        opacity={isSelected ? 1 : 0.8}
        dash={connector.style === 'dashed' ? [8, 4] : undefined}
        lineCap="round"
        lineJoin="round"
        listening={false}
        shadowColor={isSelected ? strokeColor : undefined}
        shadowBlur={isSelected ? 8 : 0}
        shadowOpacity={0.5}
      />
    </>
  );
};
