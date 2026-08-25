import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Circle } from 'react-konva';
import type Konva from 'konva';
import { useBoardStore } from '../../store/boardStore';
import { setGlobalStageRef } from '../../utils/stageRef';
import { StickyCard } from '../Card/StickyCard';
import { ConnectorLine } from '../Connector/ConnectorLine';
import { ConnectorCreator } from '../Connector/ConnectorCreator';
import { ClusterLabel } from '../Cluster/ClusterLabel';

const MIN_SCALE = 0.1;
const MAX_SCALE = 4;
const ZOOM_STEP = 1.08;

// Dot grid settings
const DOT_SPACING = 30;
const DOT_RADIUS = 1.2;
const DOT_COLOR = 'rgba(0,0,0,0.08)';

export const InfiniteCanvas: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const isPanning = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });

  const {
    cards, connectors, clusters,
    viewport, setViewport,
    activeTool,
    selectedIds, setSelectedIds, clearSelection,
    addCard, moveCard, bringToFront,
    editingCardId, setEditingCardId,
    connectingFromId, setConnectingFromId,
    addConnector,
    setActiveTool,
  } = useBoardStore();

  // Resize handler
  // Register stage ref globally for export
  useEffect(() => {
    if (stageRef.current) {
      setGlobalStageRef(stageRef.current);
    }
    return () => setGlobalStageRef(null);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setStageSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Wheel zoom ──────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = viewport.scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - viewport.x) / oldScale,
        y: (pointer.y - viewport.y) / oldScale,
      };

      const direction = e.evt.deltaY < 0 ? 1 : -1;
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, direction > 0 ? oldScale * ZOOM_STEP : oldScale / ZOOM_STEP)
      );

      setViewport({
        scale: newScale,
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [viewport, setViewport]
  );

  // ─── Stage mouse down (pan or place card) ────────────────────────
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only handle clicks on the stage itself (not on cards, etc.)
      if (e.target !== e.currentTarget && e.target.getClassName() !== 'Rect') {
        return;
      }

      const isBackgroundClick =
        e.target === e.currentTarget ||
        e.target.name() === 'background' ||
        e.target.name() === 'dot';

      if (!isBackgroundClick) return;

      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // World coordinates
      const worldX = (pointer.x - viewport.x) / viewport.scale;
      const worldY = (pointer.y - viewport.y) / viewport.scale;

      if (activeTool === 'card') {
        addCard(worldX - 110, worldY - 70);
        setActiveTool('select');
        return;
      }

      if (activeTool === 'cluster') {
        const { addCluster } = useBoardStore.getState();
        addCluster(worldX - 150, worldY - 20);
        setActiveTool('select');
        return;
      }

      // Middle click or hand tool or space → pan
      if (e.evt.button === 1 || activeTool === 'hand') {
        isPanning.current = true;
        lastPointerPos.current = { x: e.evt.clientX, y: e.evt.clientY };
        return;
      }

      // Left click on background → clear selection
      if (e.evt.button === 0) {
        clearSelection();
        if (connectingFromId) {
          setConnectingFromId(null);
        }
      }
    },
    [activeTool, viewport, addCard, clearSelection, connectingFromId, setConnectingFromId, setActiveTool]
  );

  // ─── Stage double click (instant card creation on empty canvas) ────
  const handleStageDblClick = useCallback(
    (e: Konva.KonvaEventObject<any>) => {
      const isBackgroundClick =
        e.target === e.currentTarget ||
        e.target.name() === 'background' ||
        e.target.name() === 'dot';

      if (!isBackgroundClick) return;

      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const worldX = (pointer.x - viewport.x) / viewport.scale;
      const worldY = (pointer.y - viewport.y) / viewport.scale;

      const newId = addCard(worldX - 110, worldY - 70);
      setSelectedIds([newId]);
      setEditingCardId(newId);
      setActiveTool('select');
    },
    [viewport, addCard, setSelectedIds, setEditingCardId, setActiveTool]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPanning.current) return;
      const dx = e.evt.clientX - lastPointerPos.current.x;
      const dy = e.evt.clientY - lastPointerPos.current.y;
      lastPointerPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      setViewport({
        x: viewport.x + dx,
        y: viewport.y + dy,
      });
    },
    [viewport, setViewport]
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // ─── Card interaction handlers ───────────────────────────────────
  const handleCardSelect = useCallback(
    (id: string, e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === 'connector') {
        if (!connectingFromId) {
          setConnectingFromId(id);
        } else if (connectingFromId !== id) {
          addConnector(connectingFromId, id);
          setConnectingFromId(null);
        }
        return;
      }
      if (e.evt.shiftKey) {
        const store = useBoardStore.getState();
        store.toggleSelection(id);
      } else {
        setSelectedIds([id]);
      }
      bringToFront(id);
    },
    [activeTool, connectingFromId, setConnectingFromId, addConnector, setSelectedIds, bringToFront]
  );

  const handleCardDragStart = useCallback(
    (id: string) => {
      // Push history on drag start
      const store = useBoardStore.getState();
      store.pushHistory();
      bringToFront(id);
    },
    [bringToFront]
  );

  const handleCardDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      moveCard(id, x, y);
    },
    [moveCard]
  );

  const handleCardDoubleClick = useCallback(
    (id: string) => {
      setEditingCardId(id);
    },
    [setEditingCardId]
  );

  // ─── Compute dot grid ────────────────────────────────────────────
  const renderDotGrid = useCallback(() => {
    const { x: vx, y: vy, scale } = viewport;
    const dots: React.ReactElement[] = [];

    // Only render if scale is reasonable
    if (scale < 0.2) return null;

    const adjustedSpacing = DOT_SPACING;
    const startX = Math.floor((-vx / scale) / adjustedSpacing) * adjustedSpacing;
    const startY = Math.floor((-vy / scale) / adjustedSpacing) * adjustedSpacing;
    const endX = startX + (stageSize.width / scale) + adjustedSpacing;
    const endY = startY + (stageSize.height / scale) + adjustedSpacing;

    // Limit dots rendered for performance
    const maxDots = 2000;
    let count = 0;
    for (let x = startX; x < endX && count < maxDots; x += adjustedSpacing) {
      for (let y = startY; y < endY && count < maxDots; y += adjustedSpacing) {
        dots.push(
          <Circle
            key={`dot-${x}-${y}`}
            x={x}
            y={y}
            radius={DOT_RADIUS / scale}
            fill={DOT_COLOR}
            name="dot"
            listening={false}
          />
        );
        count++;
      }
    }
    return dots;
  }, [viewport, stageSize]);

  // ─── Sort cards by zIndex for rendering ──────────────────────────
  const sortedCards = [...cards].sort((a, b) => a.zIndex - b.zIndex);

  // Cursor style
  let cursor = 'default';
  if (activeTool === 'hand' || isPanning.current) cursor = 'grab';
  if (activeTool === 'card') cursor = 'crosshair';
  if (activeTool === 'connector') cursor = 'crosshair';
  if (activeTool === 'cluster') cursor = 'crosshair';

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      x={viewport.x}
      y={viewport.y}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onDblClick={handleStageDblClick}
      onDblTap={handleStageDblClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor }}
    >
      {/* Background layer */}
      <Layer>
        <Rect
          x={-10000}
          y={-10000}
          width={20000}
          height={20000}
          fill="transparent"
          name="background"
        />
        {renderDotGrid()}
      </Layer>

      {/* Clusters layer */}
      <Layer>
        {clusters.map(cluster => (
          <ClusterLabel
            key={cluster.id}
            cluster={cluster}
            isSelected={selectedIds.includes(cluster.id)}
            onSelect={(id) => setSelectedIds([id])}
          />
        ))}
      </Layer>

      {/* Connectors layer */}
      <Layer>
        {connectors.map(conn => {
          const fromCard = cards.find(c => c.id === conn.fromCardId);
          const toCard = cards.find(c => c.id === conn.toCardId);
          if (!fromCard || !toCard) return null;
          return (
            <ConnectorLine
              key={conn.id}
              connector={conn}
              fromCard={fromCard}
              toCard={toCard}
              isSelected={selectedIds.includes(conn.id)}
              onSelect={(id) => setSelectedIds([id])}
            />
          );
        })}
        {connectingFromId && (
          <ConnectorCreator
            fromCard={cards.find(c => c.id === connectingFromId)!}
            stageRef={stageRef}
            viewport={viewport}
          />
        )}
      </Layer>

      {/* Cards layer */}
      <Layer>
        {sortedCards.map(card => (
          <StickyCard
            key={card.id}
            card={card}
            isSelected={selectedIds.includes(card.id)}
            isEditing={editingCardId === card.id}
            isConnecting={activeTool === 'connector'}
            isConnectingSource={connectingFromId === card.id}
            onSelect={handleCardSelect}
            onDragStart={handleCardDragStart}
            onDragEnd={handleCardDragEnd}
            onDoubleClick={handleCardDoubleClick}
          />
        ))}
      </Layer>
    </Stage>
  );
};
