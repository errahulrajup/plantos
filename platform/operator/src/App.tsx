import React, { useState } from 'react';
import { ActiveStepView } from './components/ActiveStepView';

// Mock recipe sequence for testing
const mockSteps = [
  { sequence: 1, name: 'Pre-Heating', description: 'Heat the vessel to target temperature before adding ingredients.', parameters: { 'Actual Temperature (C)': null } },
  { sequence: 2, name: 'Add Ingredients', description: 'Add raw materials as per BOM.', parameters: { 'Sugar Added (kg)': null, 'Water Added (L)': null } },
  { sequence: 3, name: 'Mixing Phase', description: 'Run agitator until homogenous.', parameters: { 'Mix Duration (min)': null } }
];

function App() {
  const [activeBatch, setActiveBatch] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleStepComplete = (data: any) => {
    console.log('Step completed with data:', data);
    if (currentStepIndex < mockSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      alert('Batch Completed Successfully!');
      setActiveBatch(null);
      setCurrentStepIndex(0);
    }
  };

  if (!activeBatch) {
    return (
      <div className="operator-layout">
        <header className="operator-header">
          PlantOS Terminal
          <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>Station: MIX-01</span>
        </header>
        <div className="operator-content">
          <h2 style={{ marginBottom: 'var(--spacing-large)' }}>Assigned Batches</h2>
          <button 
            className="btn-large btn-primary"
            onClick={() => {
              setActiveBatch('BATCH-10024');
              setCurrentStepIndex(0);
            }}
          >
            START BATCH-10024 (Margarine 500g)
          </button>
        </div>
      </div>
    );
  }

  const currentStep = mockSteps[currentStepIndex];

  return (
    <div className="operator-layout">
      <header className="operator-header">
        Executing: {activeBatch}
        <button className="btn-large btn-danger" style={{ width: 'auto', padding: '0 24px', height: '48px' }} onClick={() => setActiveBatch(null)}>
          HOLD BATCH
        </button>
      </header>
      <div className="operator-content" style={{ display: 'flex', gap: 'var(--spacing-xl)' }}>
        <div style={{ flex: 2 }}>
          <ActiveStepView 
            batchId={activeBatch} 
            stepData={currentStep} 
            onComplete={handleStepComplete} 
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-large)' }}>
          <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '8px' }}>Live Process Data</h3>
          <LiveTrend equipmentTag="HEATER-01" property="Temperature" unit="°C" />
          <LiveTrend equipmentTag="MIXER-01" property="Speed_RPM" unit="RPM" />
        </div>
      </div>
    </div>
  );
}

export default App;
