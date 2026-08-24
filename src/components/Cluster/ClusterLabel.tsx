import { Group, Rect, Text } from 'react-konva';
import type { Cluster } from '../../types/board';
import { useBoardStore } from '../../store/boardStore';

interface ClusterLabelProps {
  cluster: Cluster;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const ClusterLabel: React.FC<ClusterLabelProps> = ({
  cluster,
  isSelected,
  onSelect,
}) => {
  const { updateCluster, pushHistory } = useBoardStore();

  const handleDragEnd = (e: any) => {
    updateCluster(cluster.id, { x: e.target.x(), y: e.target.y() });
  };

  const handleDblClick = () => {
    const newLabel = prompt('Cluster label:', cluster.label);
    if (newLabel !== null) {
      updateCluster(cluster.id, { label: newLabel });
    }
  };

  return (
    <Group
      x={cluster.x}
      y={cluster.y}
      draggable
      onClick={() => onSelect(cluster.id)}
      onDblClick={handleDblClick}
      onDragStart={() => pushHistory()}
      onDragEnd={handleDragEnd}
    >
      {/* Cluster background area (dashed outline) */}
      <Rect
        width={cluster.width}
        height={cluster.height}
        fill="rgba(244, 236, 216, 0.12)"
        stroke={isSelected ? '#c0392b' : 'rgba(160, 111, 66, 0.3)'}
        strokeWidth={isSelected ? 2 : 1.5}
        dash={[8, 6]}
        cornerRadius={8}
      />

      {/* Label background */}
      <Rect
        x={12}
        y={-14}
        width={Math.max(cluster.label.length * 9 + 24, 80)}
        height={28}
        fill="#241d18"
        cornerRadius={3}
      />

      {/* Label text */}
      <Text
        x={24}
        y={-8}
        text={cluster.label.toUpperCase()}
        fontFamily="'Inter', -apple-system, sans-serif"
        fontSize={11}
        fontStyle="bold"
        letterSpacing={1.2}
        fill="#f4ecd8"
      />
    </Group>
  );
};
