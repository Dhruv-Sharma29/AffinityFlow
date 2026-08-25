import React from 'react';
import { Rect, Ellipse, Line, Star } from 'react-konva';
import type { Shape, ShapeType } from '../../types/board';
import {
  IconRectangle,
  IconCircle,
  IconTriangle,
  IconDiamond,
  IconStar,
  IconHexagon,
} from '../Icons/Icons';

export interface ShapeRenderProps {
  shape: Shape;
  fill: string;
  stroke: string;
  strokeWidth: number;
  width: number;
  height: number;
}

export interface ShapeDefinition {
  type: ShapeType;
  label: string;
  icon: (props: { size?: number; color?: string }) => React.ReactElement;
  defaultWidth: number;
  defaultHeight: number;
  renderKonvaShape: (props: ShapeRenderProps) => React.ReactElement;
  getAnchorPoint: (shape: Shape) => { x: number; y: number };
}

export const SHAPE_DEFINITIONS: Record<ShapeType, ShapeDefinition> = {
  rectangle: {
    type: 'rectangle',
    label: 'Rectangle',
    icon: IconRectangle,
    defaultWidth: 160,
    defaultHeight: 110,
    renderKonvaShape: ({ width, height, fill, stroke, strokeWidth }) => (
      <Rect
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={4}
      />
    ),
    getAnchorPoint: (shape) => ({
      x: shape.x + shape.width / 2,
      y: shape.y,
    }),
  },
  circle: {
    type: 'circle',
    label: 'Circle',
    icon: IconCircle,
    defaultWidth: 130,
    defaultHeight: 130,
    renderKonvaShape: ({ width, height, fill, stroke, strokeWidth }) => (
      <Ellipse
        x={width / 2}
        y={height / 2}
        radiusX={Math.max(1, width / 2)}
        radiusY={Math.max(1, height / 2)}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    ),
    getAnchorPoint: (shape) => ({
      x: shape.x + shape.width / 2,
      y: shape.y,
    }),
  },
  triangle: {
    type: 'triangle',
    label: 'Triangle',
    icon: IconTriangle,
    defaultWidth: 140,
    defaultHeight: 120,
    renderKonvaShape: ({ width, height, fill, stroke, strokeWidth }) => {
      const points = [width / 2, 0, width, height, 0, height];
      return (
        <Line
          points={points}
          closed
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          lineJoin="round"
        />
      );
    },
    getAnchorPoint: (shape) => ({
      x: shape.x + shape.width / 2,
      y: shape.y,
    }),
  },
  diamond: {
    type: 'diamond',
    label: 'Diamond',
    icon: IconDiamond,
    defaultWidth: 140,
    defaultHeight: 140,
    renderKonvaShape: ({ width, height, fill, stroke, strokeWidth }) => {
      const points = [
        width / 2, 0,
        width, height / 2,
        width / 2, height,
        0, height / 2,
      ];
      return (
        <Line
          points={points}
          closed
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          lineJoin="round"
        />
      );
    },
    getAnchorPoint: (shape) => ({
      x: shape.x + shape.width / 2,
      y: shape.y,
    }),
  },
  star: {
    type: 'star',
    label: 'Star',
    icon: IconStar,
    defaultWidth: 140,
    defaultHeight: 140,
    renderKonvaShape: ({ width, height, fill, stroke, strokeWidth }) => {
      const minDim = Math.min(width, height);
      return (
        <Star
          x={width / 2}
          y={height / 2}
          numPoints={5}
          innerRadius={Math.max(2, minDim * 0.22)}
          outerRadius={Math.max(4, minDim * 0.48)}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          lineJoin="round"
        />
      );
    },
    getAnchorPoint: (shape) => ({
      x: shape.x + shape.width / 2,
      y: shape.y,
    }),
  },
  hexagon: {
    type: 'hexagon',
    label: 'Hexagon',
    icon: IconHexagon,
    defaultWidth: 150,
    defaultHeight: 130,
    renderKonvaShape: ({ width, height, fill, stroke, strokeWidth }) => {
      const points = [
        width * 0.25, 0,
        width * 0.75, 0,
        width, height * 0.5,
        width * 0.75, height,
        width * 0.25, height,
        0, height * 0.5,
      ];
      return (
        <Line
          points={points}
          closed
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          lineJoin="round"
        />
      );
    },
    getAnchorPoint: (shape) => ({
      x: shape.x + shape.width / 2,
      y: shape.y,
    }),
  },
};

export const DEFAULT_SHAPE_TYPE: ShapeType = 'rectangle';

export function getShapeDefinition(type: ShapeType): ShapeDefinition {
  return SHAPE_DEFINITIONS[type] || SHAPE_DEFINITIONS.rectangle;
}

export function getAllShapeDefinitions(): ShapeDefinition[] {
  return Object.values(SHAPE_DEFINITIONS);
}
