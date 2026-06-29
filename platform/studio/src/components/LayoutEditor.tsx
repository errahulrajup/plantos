import React, { useState } from 'react';

interface Point { x: number; y: number }
interface PlacedAsset { id: string; type: string; name: string; position: Point }

interface LayoutEditorProps {
  onSelectAsset: (asset: PlacedAsset | null) => void;
}

export const LayoutEditor: React.FC<LayoutEditorProps> = ({ onSelectAsset }) => {
  const [assets, setAssets] = useState<PlacedAsset[]>([]);
  const [draggedItem, setDraggedItem] = useState<{ id: string, offset: Point } | null>(null);

  // Mock initial data
  React.useEffect(() => {
    setAssets([
      { id: 'T1', type: 'StorageTank', name: 'Tank A', position: { x: 100, y: 150 } },
      { id: 'P1', type: 'TransferPump', name: 'Pump 1', position: { x: 300, y: 250 } }
    ]);
  }, []);

  const handlePointerDown = (e: React.PointerEvent, asset: PlacedAsset) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggedItem({
      id: asset.id,
      offset: { x: e.clientX - asset.position.x, y: e.clientY - asset.position.y }
    });
    onSelectAsset(asset);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedItem) return;
    
    setAssets(prev => prev.map(a => {
      if (a.id === draggedItem.id) {
        return {
          ...a,
          position: {
            x: e.clientX - draggedItem.offset.x,
            y: e.clientY - draggedItem.offset.y
          }
        };
      }
      return a;
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggedItem) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      setDraggedItem(null);
    }
  };

  return (
    <div 
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={(e) => {
        // Deselect if clicking on empty background
        if (e.target === e.currentTarget) onSelectAsset(null);
      }}
    >
      <svg width="100%" height="100%" style={{ display: 'block', touchAction: 'none' }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {assets.map(a => (
          <g 
            key={a.id} 
            transform={`translate(${a.position.x}, ${a.position.y})`}
            onPointerDown={(e) => handlePointerDown(e, a)}
            style={{ cursor: draggedItem?.id === a.id ? 'grabbing' : 'grab' }}
          >
            {/* Simple generic SVG for equipment */}
            <rect 
              x="0" y="0" width="80" height="100" 
              rx="4"
              fill="var(--color-background-surface)" 
              stroke="var(--color-border)" 
              strokeWidth="2" 
            />
            <rect 
              x="-10" y="20" width="100" height="60" 
              rx="2"
              fill="var(--color-background-panel)" 
              stroke="var(--color-border-focus)" 
              strokeWidth="1" 
            />
            <text 
              x="40" y="55" 
              textAnchor="middle" 
              fill="var(--color-text-primary)"
              fontSize="12px"
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
            >
              {a.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
