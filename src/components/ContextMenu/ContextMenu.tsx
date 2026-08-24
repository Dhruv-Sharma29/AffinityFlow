import { useEffect, useState, useCallback } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { CARD_COLORS } from '../../types/board';
import type { CardColor } from '../../types/board';
import {
  IconEdit, IconTrash, IconCopy, IconLink,
  IconPalette, IconBringToFront,
} from '../Icons/Icons';
import './ContextMenu.css';

interface MenuPosition {
  x: number;
  y: number;
}

interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  danger?: boolean;
  dividerAfter?: boolean;
}

export const ContextMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [targetId, setTargetId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const {
    cards, connectors,
    selectedIds, setSelectedIds,
    setEditingCardId,
    deleteCard, deleteConnector,
    updateCard, bringToFront,
    addCard,
    setActiveTool, setConnectingFromId,
  } = useBoardStore();

  const close = useCallback(() => {
    setIsOpen(false);
    setShowColorPicker(false);
    setTargetId(null);
  }, []);

  // Listen for custom context menu events from the canvas
  useEffect(() => {
    const handleContextMenu = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        e.preventDefault();
        setPosition({ x: detail.clientX, y: detail.clientY });
        setTargetId(detail.targetId);
        setSelectedIds([detail.targetId]);
        setIsOpen(true);
        setShowColorPicker(false);
      }
    };

    // Also listen for native right-click to close
    const handleNativeContext = (e: MouseEvent) => {
      // If clicking outside the menu, close it
      const target = e.target as HTMLElement;
      if (!target.closest('.context-menu')) {
        close();
      }
    };

    const handleClick = () => close();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    window.addEventListener('canvas-context-menu', handleContextMenu);
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('contextmenu', handleNativeContext);

    return () => {
      window.removeEventListener('canvas-context-menu', handleContextMenu);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('contextmenu', handleNativeContext);
    };
  }, [close, setSelectedIds]);

  if (!isOpen || !targetId) return null;

  const targetCard = cards.find(c => c.id === targetId);
  const targetConnector = connectors.find(c => c.id === targetId);

  // Build menu items based on target type
  const menuItems: ContextMenuItem[] = [];

  if (targetCard) {
    menuItems.push(
      {
        label: 'Edit',
        icon: <IconEdit size={15} />,
        action: () => { setEditingCardId(targetId); close(); },
      },
      {
        label: 'Change Color',
        icon: <IconPalette size={15} />,
        action: () => setShowColorPicker(!showColorPicker),
      },
      {
        label: 'Duplicate',
        icon: <IconCopy size={15} />,
        action: () => {
          const id = addCard(targetCard.x + 30, targetCard.y + 30, targetCard.color);
          const store = useBoardStore.getState();
          store.updateCard(id, {
            title: targetCard.title,
            body: targetCard.body,
            eyebrow: targetCard.eyebrow,
          });
          close();
        },
        dividerAfter: true,
      },
      {
        label: 'Connect to…',
        icon: <IconLink size={15} />,
        action: () => {
          setActiveTool('connector');
          setConnectingFromId(targetId);
          close();
        },
      },
      {
        label: 'Bring to Front',
        icon: <IconBringToFront size={15} />,
        action: () => { bringToFront(targetId); close(); },
        dividerAfter: true,
      },
      {
        label: 'Delete',
        icon: <IconTrash size={15} />,
        action: () => { deleteCard(targetId); close(); },
        danger: true,
      },
    );
  } else if (targetConnector) {
    menuItems.push(
      {
        label: 'Delete Connection',
        icon: <IconTrash size={15} />,
        action: () => { deleteConnector(targetId); close(); },
        danger: true,
      },
    );
  }

  // Clamp position to viewport
  const menuW = 200;
  const menuH = menuItems.length * 36 + 16;
  const x = Math.min(position.x, window.innerWidth - menuW - 8);
  const y = Math.min(position.y, window.innerHeight - menuH - 8);

  const handleColorChange = (color: CardColor) => {
    if (targetCard) {
      updateCard(targetId, { color });
    }
    close();
  };

  return (
    <div
      className="context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, i) => (
        <div key={i}>
          <button
            className={`context-menu-item ${item.danger ? 'danger' : ''}`}
            onClick={item.action}
          >
            <span className="context-menu-icon">{item.icon}</span>
            <span className="context-menu-label">{item.label}</span>
          </button>
          {item.dividerAfter && <div className="context-menu-divider" />}
        </div>
      ))}

      {/* Color picker submenu */}
      {showColorPicker && (
        <div className="context-menu-colors">
          {(Object.keys(CARD_COLORS) as CardColor[]).map((c) => (
            <button
              key={c}
              className={`context-menu-color ${targetCard?.color === c ? 'active' : ''}`}
              style={{ backgroundColor: CARD_COLORS[c].bg, borderColor: CARD_COLORS[c].border }}
              onClick={() => handleColorChange(c)}
              title={c}
            />
          ))}
        </div>
      )}
    </div>
  );
};
