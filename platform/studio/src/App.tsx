import React, { useState } from 'react';
import { AssetExplorer } from './components/AssetExplorer';
import { PropertyInspector } from './components/PropertyInspector';
import { LayoutEditor } from './components/LayoutEditor';

function App() {
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  const handleSelectAsset = (asset: any | null) => {
    if (!asset) {
      setSelectedAsset(null);
      return;
    }
    // Hydrate the visual asset with full metadata
    setSelectedAsset({
      tag: asset.id,
      name: asset.name,
      businessCode: `MAT-${asset.id}`,
      capabilities: asset.type === 'StorageTank' ? ['CanStore'] : ['CanTransfer'],
      properties: {
        x: asset.position.x,
        y: asset.position.y,
        status: 'Active'
      }
    });
  };

  const handleCompile = () => {
    // In a real application, this would POST the payload to the PlantOS Kernel API
    // which wraps the ConfigurationCompiler.
    const rawConfig = {
      version: '1.0.0',
      author: 'PlantOS Studio',
      name: 'PlantSmör Layout',
      dependencies: { 'plantos.kernel': '^1.0.0' },
      assets: [selectedAsset].filter(Boolean), // Mocking payload with selected asset
      recipes: []
    };

    alert(`Simulating Compiler Validation...\n\nPayload:\n${JSON.stringify(rawConfig, null, 2)}\n\n(In production, this generates a signed .plantos package via plantos-core)`);
  };

  return (
    <div className="studio-layout">
      {/* Top Ribbon */}
      <header className="studio-header">
        <div className="studio-logo" style={{ fontWeight: 700, fontSize: '1.25rem' }}>
          PlantOS <span style={{ color: 'var(--color-alarm-info)', fontWeight: 400 }}>Studio</span>
        </div>
        <div className="studio-actions">
          <button className="btn">Validate</button>
          <button className="btn btn-primary" style={{ marginLeft: '0.5rem' }} onClick={handleCompile}>Compile Package</button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="studio-main">
        {/* Left Sidebar: Asset Explorer */}
        <aside className="studio-sidebar">
          <div className="studio-sidebar-header">
            Asset Explorer
          </div>
          <AssetExplorer />
        </aside>

        {/* Center: Interactive Canvas */}
        <section className="studio-canvas-container">
          <LayoutEditor onSelectAsset={handleSelectAsset} />
        </section>

        {/* Right Sidebar: Property Inspector */}
        <aside className="studio-inspector">
          <div className="studio-sidebar-header">
            Property Inspector
          </div>
          <PropertyInspector selectedAsset={selectedAsset} />
        </aside>
      </main>
    </div>
  );
}

export default App;
