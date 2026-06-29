import React from 'react';

interface PropertyInspectorProps {
  selectedAsset: any | null;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({ selectedAsset }) => {
  if (!selectedAsset) {
    return (
      <div style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        Select an asset on the canvas to inspect its metadata and configuration.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>{selectedAsset.name}</h3>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {selectedAsset.tag}
        </span>
      </div>

      <div style={{ padding: 'var(--spacing-4)', flex: 1, overflowY: 'auto' }}>
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            Business Code (ERP)
          </label>
          <input 
            type="text" 
            defaultValue={selectedAsset.businessCode || ''}
            style={{
              width: '100%',
              padding: 'var(--spacing-2)',
              backgroundColor: 'var(--color-background-base)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            Capabilities (Read-only from Schema)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {selectedAsset.capabilities?.map((cap: string) => (
              <span key={cap} style={{ 
                backgroundColor: 'var(--color-background-hover)',
                border: '1px solid var(--color-border)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: 'var(--font-size-xs)'
              }}>
                {cap}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic Schema Properties */}
        <div style={{ marginTop: 'var(--spacing-6)' }}>
          <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '4px', marginBottom: 'var(--spacing-3)' }}>
            Equipment Properties
          </h4>
          
          {Object.entries(selectedAsset.properties || {}).map(([key, value]) => (
            <div key={key} style={{ marginBottom: 'var(--spacing-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-sm)' }}>{key}</span>
              <input 
                type="text" 
                defaultValue={String(value)}
                style={{
                  width: '120px',
                  padding: 'var(--spacing-1) var(--spacing-2)',
                  backgroundColor: 'var(--color-background-base)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  borderRadius: '4px',
                  textAlign: 'right'
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
