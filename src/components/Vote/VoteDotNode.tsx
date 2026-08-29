import React from 'react';
import { Circle, Group, Text } from 'react-konva';
import type Konva from 'konva';
import type { VoteDot } from '../../types/board';
import { VOTE_COLORS } from '../../types/board';

interface Props { dot: VoteDot; count: number; isSelected: boolean; onSelect: (id: string, e: Konva.KonvaEventObject<MouseEvent>) => void; onMove: (id: string, x: number, y: number) => void; }
export const VoteDotNode: React.FC<Props> = ({ dot, count, isSelected, onSelect, onMove }) => <Group x={dot.x} y={dot.y} draggable onClick={e => onSelect(dot.id, e)} onTap={e => onSelect(dot.id, e as unknown as Konva.KonvaEventObject<MouseEvent>)} onDragEnd={e => onMove(dot.id, e.target.x(), e.target.y())}>
  <Circle radius={10} fill={VOTE_COLORS[dot.color]} stroke={isSelected ? '#241d18' : '#fff'} strokeWidth={isSelected ? 3 : 2} shadowColor="#241d18" shadowBlur={4} shadowOpacity={0.25} />
  {count > 1 && <Text x={14} y={-7} text={String(count)} fontSize={12} fontStyle="bold" fill="#241d18" />}
</Group>;
