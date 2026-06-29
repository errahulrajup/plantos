import React, { useState } from 'react';

interface ActiveStepViewProps {
  batchId: string;
  stepData: any;
  onComplete: (collectedData: Record<string, any>) => void;
}

export const ActiveStepView: React.FC<ActiveStepViewProps> = ({ batchId, stepData, onComplete }) => {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isCompleting, setIsCompleting] = useState(false);

  const handleInputChange = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleComplete = () => {
    setIsCompleting(true);
    // Simulate network delay for completing step
    setTimeout(() => {
      onComplete(inputs);
      setInputs({});
      setIsCompleting(false);
    }, 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ 
        backgroundColor: 'var(--color-bg-card)', 
        padding: 'var(--spacing-xl)', 
        borderRadius: 'var(--border-radius)',
        marginBottom: 'var(--spacing-large)'
      }}>
        <h2 style={{ color: 'var(--color-primary)', marginBottom: '8px' }}>
          Step {stepData.sequence}: {stepData.name}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.25rem' }}>
          {stepData.description || 'Please follow the instructions and enter the required parameters below.'}
        </p>
      </div>

      <div style={{ flex: 1 }}>
        {Object.keys(stepData.parameters || {}).map(paramKey => (
          <div key={paramKey}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '1.25rem', fontWeight: 500 }}>
              {paramKey}
            </label>
            <input 
              type="number"
              className="touch-input"
              value={inputs[paramKey] || ''}
              onChange={e => handleInputChange(paramKey, e.target.value)}
              placeholder={`Enter ${paramKey}`}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-xl)' }}>
        <button 
          className="btn-large btn-success" 
          onClick={handleComplete}
          disabled={isCompleting}
          style={{ opacity: isCompleting ? 0.7 : 1 }}
        >
          {isCompleting ? 'Processing...' : 'CONFIRM & COMPLETE STEP'}
        </button>
      </div>
    </div>
  );
};
