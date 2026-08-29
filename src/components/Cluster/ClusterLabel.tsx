import React, { useRef, useEffect, useCallback } from 'react';
import { Group, Rect, Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { Cluster } from '../../types/board';
import { CLUSTER_COLORS } from '../../types/board';
import { useBoardStore } from '../../store/boardStore';

interface ClusterLabelProps {
  cluster: Cluster;
  isSelected: boolean;
  onSelect: (id: string, e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, width: number, height: number, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
}

export const ClusterLabel: React.FC<ClusterLabelProps> = ({
  cluster,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
  onDoubleClick,
}) => {
  const groupRef = useRef<Konva.Group>(null);
<<<<<<< HEAD
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const { addCardToCluster } = useBoardStore();

  const theme = CLUSTER_COLORS[cluster.color || 'slate'] || CLUSTER_COLORS.slate;

  // Attach transformer to background rect when selected
  useEffect(() => {
    if (isSelected && trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
=======
  const trRef = useRef<Konva.Transformer>(null);
  const lastDragPos = useRef({ x: cluster.x, y: cluster.y });

  const theme = CLUSTER_COLORS[cluster.color || 'slate'] || CLUSTER_COLORS.slate;

  // Attach Transformer when selected
  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, cluster.width, cluster.height]);

<<<<<<< HEAD
  const handleTransformEnd = useCallback(() => {
    const rect = rectRef.current;
    const group = groupRef.current;
    if (!rect || !group) return;

    const scaleX = rect.scaleX();
    const scaleY = rect.scaleY();
    const rectX = rect.x();
    const rectY = rect.y();

    // Reset scales
    rect.scaleX(1);
    rect.scaleY(1);
    rect.x(0);
    rect.y(0);

    const newWidth = Math.max(100, Math.round(cluster.width * scaleX));
    const newHeight = Math.max(80, Math.round(cluster.height * scaleY));
    const newX = group.x() + rectX;
    const newY = group.y() + rectY;

    group.position({ x: newX, y: newY });
    onTransformEnd(cluster.id, newWidth, newHeight, newX, newY);
  }, [cluster.id, cluster.width, cluster.height, onTransformEnd]);

  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    window.dispatchEvent(
      new CustomEvent('canvas-context-menu', {
        detail: {
          clientX: e.evt.clientX,
          clientY: e.evt.clientY,
          targetId: cluster.id,
        },
      })
    );
  };
=======
  const handleDragStart = useCallback(() => {
    lastDragPos.current = { x: cluster.x, y: cluster.y };
    onDragStart(cluster.id);
  }, [cluster.id, cluster.x, cluster.y, onDragStart]);

  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const dx = node.x() - lastDragPos.current.x;
    const dy = node.y() - lastDragPos.current.y;
    lastDragPos.current = { x: node.x(), y: node.y() };

    const store = useBoardStore.getState();
    store.moveMultipleItems(dx, dy, [cluster.id]);
  }, [cluster.id]);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      onDragEnd(cluster.id, node.x(), node.y());
    },
    [cluster.id, onDragEnd]
  );

  const handleTransformEnd = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(80, Math.round(cluster.width * scaleX));
    const newHeight = Math.max(60, Math.round(cluster.height * scaleY));
    const newX = Math.round(node.x());
    const newY = Math.round(node.y());

    onTransformEnd(cluster.id, newWidth, newHeight, newX, newY);
  }, [cluster.id, cluster.width, cluster.height, onTransformEnd]);

  // Compute label badge width dynamically
  const badgeText = (cluster.label || 'GROUP').toUpperCase();
  const badgeWidth = Math.max(badgeText.length * 8.5 + 28, 88);
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828

  const handleAddCardClick = (e: Konva.KonvaEventObject<any>) => {
    e.cancelBubble = true;
    addCardToCluster(cluster.id);
  };

  // Badge text width calculation (approximate)
  const badgeText = cluster.label.toUpperCase();
  const badgeWidth = Math.max(90, Math.min(240, badgeText.length * 8.5 + 44));

  return (
    <>
      <Group
        ref={groupRef}
        x={cluster.x}
        y={cluster.y}
        draggable
<<<<<<< HEAD
        name="cluster"
        id={cluster.id}
        onClick={(e) => onSelect(cluster.id, e)}
        onTap={(e) => onSelect(cluster.id, e as any)}
        onDblClick={(e) => {
          e.cancelBubble = true;
          onDoubleClick(cluster.id);
        }}
        onDblTap={(e) => {
          e.cancelBubble = true;
          onDoubleClick(cluster.id);
        }}
        onContextMenu={handleContextMenu}
        onDragStart={(e) => {
          if (e.target !== groupRef.current) return;
          dragStartPos.current = { x: groupRef.current.x(), y: groupRef.current.y() };
          onDragStart(cluster.id);
        }}
        onDragMove={(e) => {
          if (e.target !== groupRef.current) return;
          const currentX = groupRef.current.x();
          const currentY = groupRef.current.y();
          const dx = currentX - dragStartPos.current.x;
          const dy = currentY - dragStartPos.current.y;
          if (dx !== 0 || dy !== 0) {
            useBoardStore.getState().moveMultipleItems(dx, dy, [cluster.id]);
            dragStartPos.current = { x: currentX, y: currentY };
          }
        }}
        onDragEnd={(e) => {
          if (e.target !== groupRef.current) return;
          const newX = groupRef.current.x();
          const newY = groupRef.current.y();
          onDragEnd(cluster.id, newX, newY);
        }}
      >
        {/* Main Cluster Container Box */}
        <Rect
          ref={rectRef}
          x={0}
          y={0}
=======
        onClick={(e) => onSelect(cluster.id, e)}
        onTap={(e) => onSelect(cluster.id, e as unknown as Konva.KonvaEventObject<MouseEvent>)}
        onDblClick={() => onDoubleClick(cluster.id)}
        onDblTap={() => onDoubleClick(cluster.id)}
        onContextMenu={(e) => {
          e.evt.preventDefault();
          window.dispatchEvent(
            new CustomEvent('canvas-context-menu', {
              detail: {
                clientX: e.evt.clientX,
                clientY: e.evt.clientY,
                targetId: cluster.id,
              },
            })
          );
        }}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {/* Cluster background area (dashed outline & subtle fill) */}
        <Rect
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
          width={cluster.width}
          height={cluster.height}
          fill={theme.bg}
          stroke={isSelected ? '#c0392b' : theme.border}
<<<<<<< HEAD
          strokeWidth={isSelected ? 2 : 1.5}
          dash={isSelected ? undefined : [6, 4]}
          cornerRadius={10}
          name="cluster-bg"
          shadowColor="rgba(0, 0, 0, 0.04)"
          shadowBlur={8}
          shadowOffsetY={2}
        />

        {/* Top Header Badge Pill */}
        <Group x={14} y={-14}>
          {/* Badge Background */}
=======
          strokeWidth={isSelected ? 2.5 : 1.8}
          dash={isSelected ? [6, 4] : [8, 6]}
          cornerRadius={10}
          shadowColor="rgba(0, 0, 0, 0.08)"
          shadowBlur={isSelected ? 12 : 6}
          shadowOffset={{ x: 0, y: 2 }}
          shadowOpacity={0.25}
        />

        {/* Group Header Badge Pill */}
        <Group x={12} y={-14}>
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
          <Rect
            width={badgeWidth}
            height={28}
            fill={theme.badgeBg}
<<<<<<< HEAD
            cornerRadius={6}
            shadowColor="rgba(0, 0, 0, 0.25)"
            shadowBlur={6}
            shadowOffsetY={2}
          />

          {/* Group Label */}
          <Text
            x={12}
            y={8}
            text={badgeText}
            fontFamily="'Inter', sans-serif"
            fontSize={11}
            fontStyle="bold"
            letterSpacing={1.2}
            fill={theme.text}
            listening={false}
            width={badgeWidth - 36}
            ellipsis={true}
            wrap="none"
          />

          {/* Quick "+ Card" button inside badge */}
          <Group
            x={badgeWidth - 24}
            y={6}
            onClick={handleAddCardClick}
            onTap={handleAddCardClick}
          >
            <Rect
              width={16}
              height={16}
              fill="rgba(255, 255, 255, 0.2)"
              cornerRadius={3}
            />
            <Text
              x={3.5}
              y={1.5}
              text="+"
              fontFamily="'Inter', sans-serif"
              fontSize={13}
              fontStyle="bold"
              fill="#ffffff"
              listening={false}
            />
          </Group>
        </Group>
      </Group>

      {/* Konva Transformer handle overlay when selected */}
=======
            stroke={isSelected ? '#c0392b' : theme.border}
            strokeWidth={1}
            cornerRadius={6}
            shadowColor="rgba(0, 0, 0, 0.25)"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 2 }}
            shadowOpacity={0.2}
          />
          <Text
            x={12}
            y={8}
            text={badgeText}
            fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontSize={11}
            fontStyle="bold"
            letterSpacing={1.2}
            fill={theme.text}
            listening={false}
          />
        </Group>
      </Group>

      {/* Transformer handle overlay when selected */}
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          flipEnabled={false}
<<<<<<< HEAD
          keepRatio={false}
=======
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
          enabledAnchors={[
            'top-left', 'top-center', 'top-right',
            'middle-right', 'middle-left',
            'bottom-left', 'bottom-center', 'bottom-right',
          ]}
          boundBoxFunc={(oldBox, newBox) => {
<<<<<<< HEAD
            if (newBox.width < 100 || newBox.height < 80) {
=======
            if (newBox.width < 80 || newBox.height < 60) {
>>>>>>> 44a350b4f7db5dfc5ab68d135bbbc9de77169828
              return oldBox;
            }
            return newBox;
          }}
          anchorSize={8}
          anchorCornerRadius={4}
          anchorStroke="#c0392b"
          anchorFill="#ffffff"
          anchorStrokeWidth={1.5}
          borderStroke="#c0392b"
          borderStrokeWidth={1.5}
          borderDash={[4, 3]}
          onTransformEnd={handleTransformEnd}
        />
      )}
    </>
  );
};
