import React from 'react';
import { Line, Group, Rect, Text } from 'react-konva';
import type { Connector, Card, Shape } from '../../types/board';
import { CONNECTOR_COLORS } from '../../types/board';
import { useBoardStore } from '../../store/boardStore';

interface ConnectorLineProps {
  connector: Connector;
  fromItem: Card | Shape;
  toItem: Card | Shape;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function getItemAnchor(item: Card | Shape): { x: number; y: number } {
  if ('title' in item) {
    // Sticky Card: top pin
    return { x: item.x + item.width / 2, y: item.y - 6 };
  }
  // Shape: top-center or center
  return { x: item.x + item.width / 2, y: item.y };
}

// Compute catenary-like droopy curve between two pin points
function computeCurvePoints(
  x1: number, y1: number,
  x2: number, y2: number,
): { points: number[]; midX: number; midY: number } {
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
  let midX = mx;
  let midY = my;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic bezier: P = (1-t)²P0 + 2(1-t)tP1 + t²P2
    const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
    const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;
    points.push(px, py);
    if (i === 10) {
      midX = px;
      midY = py;
    }
  }
  return { points, midX, midY };
}

export const ConnectorLine: React.FC<ConnectorLineProps> = ({
  connector,
  fromItem,
  toItem,
  isSelected,
  onSelect,
}) => {
  const p1 = getItemAnchor(fromItem);
  const p2 = getItemAnchor(toItem);

  const { points, midX, midY } = computeCurvePoints(p1.x, p1.y, p2.x, p2.y);
  const strokeColor = CONNECTOR_COLORS[connector.color];
  const { setEditingConnectorId } = useBoardStore();

  const handleDoubleClick = () => {
    setEditingConnectorId(connector.id);
  };

  // Badge sizing calculation
  const labelText = connector.label || '';
  const fontSize = 10.5;
  const badgePadX = 8;
  const badgePadY = 4;
  const badgeWidth = labelText.length * 6.5 + badgePadX * 2;
  const badgeHeight = fontSize + badgePadY * 2 + 2;

  return (
    <>
      {/* Invisible wider line for easier click targeting */}
      <Line
        points={points}
        stroke="transparent"
        strokeWidth={18}
        onClick={() => onSelect(connector.id)}
        onTap={() => onSelect(connector.id)}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        onContextMenu={(e) => {
          e.evt.preventDefault();
          window.dispatchEvent(
            new CustomEvent('canvas-context-menu', {
              detail: {
                clientX: e.evt.clientX,
                clientY: e.evt.clientY,
                targetId: connector.id,
              },
            })
          );
        }}
        hitStrokeWidth={24}
      />

      {/* Visible connector line */}
      <Line
        points={points}
        stroke={strokeColor}
        strokeWidth={isSelected ? 3 : 2}
        opacity={isSelected ? 1 : 0.82}
        dash={connector.style === 'dashed' ? [8, 4] : undefined}
        lineCap="round"
        lineJoin="round"
        listening={false}
        shadowColor={isSelected ? strokeColor : undefined}
        shadowBlur={isSelected ? 8 : 0}
        shadowOpacity={0.5}
      />

      {/* Midpoint Label Tag (if present) */}
      {labelText && (
        <Group
          x={midX - badgeWidth / 2}
          y={midY - badgeHeight / 2}
          onClick={() => onSelect(connector.id)}
          onTap={() => onSelect(connector.id)}
          onDblClick={handleDoubleClick}
          onDblTap={handleDoubleClick}
          onContextMenu={(e) => {
            e.evt.preventDefault();
            window.dispatchEvent(
              new CustomEvent('canvas-context-menu', {
                detail: {
                  clientX: e.evt.clientX,
                  clientY: e.evt.clientY,
                  targetId: connector.id,
                },
              })
            );
          }}
        >
          {/* Paper tag shadow */}
          <Rect
            x={1}
            y={2}
            width={badgeWidth}
            height={badgeHeight}
            fill="rgba(20, 10, 5, 0.25)"
            cornerRadius={3}
            shadowBlur={4}
            shadowOpacity={0.3}
            listening={false}
          />
          {/* Paper tag body */}
          <Rect
            width={badgeWidth}
            height={badgeHeight}
            fill="#fcf9ee"
            stroke={isSelected ? strokeColor : '#cfbfad'}
            strokeWidth={isSelected ? 1.5 : 1}
            cornerRadius={3}
          />
          {/* Label text */}
          <Text
            x={badgePadX}
            y={badgePadY + 1}
            text={labelText}
            fontFamily="'Courier New', monospace"
            fontSize={fontSize}
            fontStyle="bold"
            fill={isSelected ? strokeColor : '#4a3f35'}
            listening={false}
          />
        </Group>
      )}
    </>
  );
};

