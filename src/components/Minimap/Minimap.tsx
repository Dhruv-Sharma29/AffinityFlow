import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { CARD_COLORS, SHAPE_COLORS, CLUSTER_COLORS } from '../../types/board';
import { IconRadarMap, IconHideMap } from '../Icons/Icons';
import './Minimap.css';

const MAP_WIDTH = 200;
const MAP_HEIGHT = 140;
const PADDING = 200;

export const Minimap: React.FC = () => {
  const { cards, shapes, clusters, textItems, voteDots, images, viewport, setViewport } = useBoardStore();
  const [isOpen, setIsOpen] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  // Calculate world bounding box
  const computeWorldBounds = useCallback(() => {
    // Current visible viewport in world coordinates
    const viewW = window.innerWidth / viewport.scale;
    const viewH = window.innerHeight / viewport.scale;
    const viewX = -viewport.x / viewport.scale;
    const viewY = -viewport.y / viewport.scale;

    let minX = viewX;
    let minY = viewY;
    let maxX = viewX + viewW;
    let maxY = viewY + viewH;

    cards.forEach((c) => {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + c.width);
      maxY = Math.max(maxY, c.y + c.height);
    });

    shapes.forEach((s) => {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    });

    clusters.forEach((cl) => {
      minX = Math.min(minX, cl.x);
      minY = Math.min(minY, cl.y);
      maxX = Math.max(maxX, cl.x + cl.width);
      maxY = Math.max(maxY, cl.y + cl.height);
    });

    textItems.forEach((text) => {
      minX = Math.min(minX, text.x);
      minY = Math.min(minY, text.y);
      maxX = Math.max(maxX, text.x + text.width);
      maxY = Math.max(maxY, text.y + text.fontSize * 2);
    });

    voteDots.forEach((dot) => {
      minX = Math.min(minX, dot.x - 12);
      minY = Math.min(minY, dot.y - 12);
      maxX = Math.max(maxX, dot.x + 12);
      maxY = Math.max(maxY, dot.y + 12);
    });

    images.forEach((image) => {
      minX = Math.min(minX, image.x);
      minY = Math.min(minY, image.y);
      maxX = Math.max(maxX, image.x + image.width);
      maxY = Math.max(maxY, image.y + image.height);
    });

    minX -= PADDING;
    minY -= PADDING;
    maxX += PADDING;
    maxY += PADDING;

    const width = Math.max(100, maxX - minX);
    const height = Math.max(100, maxY - minY);

    return { minX, minY, width, height, viewX, viewY, viewW, viewH };
  }, [cards, shapes, clusters, textItems, voteDots, images, viewport]);

  // Render miniature representation to canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    const bounds = computeWorldBounds();
    const scaleX = MAP_WIDTH / bounds.width;
    const scaleY = MAP_HEIGHT / bounds.height;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (MAP_WIDTH - bounds.width * scale) / 2;
    const offsetY = (MAP_HEIGHT - bounds.height * scale) / 2;

    const toMapX = (x: number) => offsetX + (x - bounds.minX) * scale;
    const toMapY = (y: number) => offsetY + (y - bounds.minY) * scale;

    // Draw Clusters
    clusters.forEach((cl) => {
      const mx = toMapX(cl.x);
      const my = toMapY(cl.y);
      const mw = cl.width * scale;
      const mh = cl.height * scale;
      const theme = CLUSTER_COLORS[cl.color || 'slate'] || CLUSTER_COLORS.slate;

      ctx.fillStyle = theme.bg;
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(mx, my, mw, mh);
      ctx.setLineDash([]);
    });

    // Draw Shapes
    shapes.forEach((s) => {
      const mx = toMapX(s.x);
      const my = toMapY(s.y);
      const mw = Math.max(2, s.width * scale);
      const mh = Math.max(2, s.height * scale);
      const color = SHAPE_COLORS[s.color] || SHAPE_COLORS.cream;

      ctx.fillStyle = color.bg === 'transparent' ? 'rgba(255,255,255,0.4)' : color.bg;
      ctx.strokeStyle = color.border;
      ctx.lineWidth = 1;
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeRect(mx, my, mw, mh);
    });

    // Draw Cards
    cards.forEach((c) => {
      const mx = toMapX(c.x);
      const my = toMapY(c.y);
      const mw = Math.max(3, c.width * scale);
      const mh = Math.max(2, c.height * scale);
      const color = CARD_COLORS[c.color] || CARD_COLORS.cream;

      ctx.fillStyle = color.bg;
      ctx.strokeStyle = color.border;
      ctx.lineWidth = 1;
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeRect(mx, my, mw, mh);

      // Mini pin dot
      ctx.fillStyle = color.pin;
      ctx.beginPath();
      ctx.arc(mx + mw / 2, my + 1, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw standalone text and voting dots so every board item is represented.
    textItems.forEach((text) => {
      const mx = toMapX(text.x);
      const my = toMapY(text.y);
      ctx.fillStyle = text.color;
      ctx.fillRect(mx, my, Math.max(3, text.width * scale), Math.max(2, text.fontSize * scale));
    });

    voteDots.forEach((dot) => {
      ctx.fillStyle = dot.color === 'yellow' ? '#e0ad32' : dot.color === 'green' ? '#4eaa6a' : dot.color === 'blue' ? '#4d83c4' : dot.color === 'purple' ? '#8960b5' : '#e05252';
      ctx.beginPath();
      ctx.arc(toMapX(dot.x), toMapY(dot.y), Math.max(2, 5 * scale), 0, Math.PI * 2);
      ctx.fill();
    });

    images.forEach((image) => {
      const mx = toMapX(image.x);
      const my = toMapY(image.y);
      const mw = Math.max(3, image.width * scale);
      const mh = Math.max(3, image.height * scale);
      ctx.fillStyle = '#9bb7cc';
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = '#527a96';
      ctx.strokeRect(mx, my, mw, mh);
    });
  }, [cards, shapes, clusters, textItems, voteDots, images, viewport, isOpen, computeWorldBounds]);

  // Viewport rect position on minimap
  const bounds = computeWorldBounds();
  const scaleX = MAP_WIDTH / bounds.width;
  const scaleY = MAP_HEIGHT / bounds.height;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (MAP_WIDTH - bounds.width * scale) / 2;
  const offsetY = (MAP_HEIGHT - bounds.height * scale) / 2;

  const vpLeft = Math.max(0, offsetX + (bounds.viewX - bounds.minX) * scale);
  const vpTop = Math.max(0, offsetY + (bounds.viewY - bounds.minY) * scale);
  const vpWidth = Math.min(MAP_WIDTH, bounds.viewW * scale);
  const vpHeight = Math.min(MAP_HEIGHT, bounds.viewH * scale);

  const handlePointerAction = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldTargetX = bounds.minX + (clickX - offsetX) / scale;
    const worldTargetY = bounds.minY + (clickY - offsetY) / scale;

    const newX = -(worldTargetX - (window.innerWidth / viewport.scale) / 2) * viewport.scale;
    const newY = -(worldTargetY - (window.innerHeight / viewport.scale) / 2) * viewport.scale;

    setViewport({ x: newX, y: newY });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    handlePointerAction(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    handlePointerAction(e);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="minimap-container">
      <button
        className="minimap-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Radar Minimap"
      >
        {isOpen ? <IconHideMap size={16} /> : <IconRadarMap size={16} />}
        <span>{isOpen ? 'Hide Map' : 'Radar Map'}</span>
      </button>

      {isOpen && (
        <div
          className="minimap-box"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <canvas
            ref={canvasRef}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            className="minimap-canvas"
          />

          {/* Viewport Frustum Rectangle */}
          <div
            className="minimap-viewport-rect"
            style={{
              left: `${vpLeft}px`,
              top: `${vpTop}px`,
              width: `${vpWidth}px`,
              height: `${vpHeight}px`,
            }}
          />
        </div>
      )}
    </div>
  );
};
