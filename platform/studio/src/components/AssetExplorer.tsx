import React from 'react';

// Stub for Equipment Definitions that would normally come from the Metadata Registry
const equipmentLibrary = [
  { id: 'lib-tank', name: 'Storage Tank', type: 'Storage', capabilities: ['CanStore'] },
  { id: 'lib-pump', name: 'Centrifugal Pump', type: 'Transfer', capabilities: ['CanTransfer'] },
  { id: 'lib-heater', name: 'Heat Exchanger', type: 'Processing', capabilities: ['CanHeat'] },
  { id: 'lib-mixer', name: 'Agitator', type: 'Processing', capabilities: ['CanMix'] },
];

export const AssetExplorer: React.FC = () => {
  return (
    <div style={{ padding: '0' }}>
      <div style={{ padding: 'var(--spacing-3) var(--spacing-4)', borderBottom: '1px solid var(--color-border)' }}>
        <input 
          type="text" 
          placeholder="Search Library..." 
          style={{
            width: '100%',
            padding: 'var(--spacing-2)',
            backgroundColor: 'var(--color-background-base)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            borderRadius: '4px',
            outline: 'none'
          }}
        />
      </div>
      
      <div style={{ overflowY: 'auto', flex: 1, padding: 'var(--spacing-2)' }}>
        {equipmentLibrary.map(item => (
          <div 
            key={item.id} 
            draggable
            style={{
              padding: 'var(--spacing-3)',
              marginBottom: 'var(--spacing-2)',
              backgroundColor: 'var(--color-background-panel)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              cursor: 'grab',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <span style={{ fontWeight: 500 }}>{item.name}</span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Type: {item.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
