import React, { useState, useEffect } from 'react';

interface LiveTrendProps {
  equipmentTag: string;
  property: string;
  unit: string;
}

export const LiveTrend: React.FC<LiveTrendProps> = ({ equipmentTag, property, unit }) => {
  const [value, setValue] = useState<number>(0);
  const [trend, setTrend] = useState<'UP' | 'DOWN' | 'STABLE'>('STABLE');

  useEffect(() => {
    // In a real app, this would poll the Historian API or use a WebSocket.
    // For this POC, we simulate the OPC-UA values directly in the UI component
    // to mimic what the `MachineSimulator` is doing in the backend.
    
    let currentVal = property === 'Temperature' ? 25 : 0;
    
    const timer = setInterval(() => {
      let change = 0;
      if (property === 'Temperature') {
        change = (Math.random() * 2) - 0.5; // Slowly creeping up usually
      } else if (property === 'Speed_RPM') {
        if (currentVal < 150) change = 5;
        else change = (Math.random() * 4) - 2;
      }

      currentVal += change;
      
      setValue(prev => {
        if (currentVal > prev + 0.1) setTrend('UP');
        else if (currentVal < prev - 0.1) setTrend('DOWN');
        else setTrend('STABLE');
        
        return Number(currentVal.toFixed(1));
      });
      
    }, 1000);

    return () => clearInterval(timer);
  }, [property]);

  return (
    <div style={{
      backgroundColor: 'var(--color-bg-card)',
      border: '2px solid #333',
      borderRadius: 'var(--border-radius)',
      padding: 'var(--spacing-large)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '200px'
    }}>
      <div style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', textTransform: 'uppercase', marginBottom: '8px' }}>
        {equipmentTag} - {property}
      </div>
      <div style={{ 
        fontSize: '3rem', 
        fontWeight: 700, 
        color: trend === 'UP' ? 'var(--color-danger)' : trend === 'DOWN' ? 'var(--color-primary)' : 'var(--color-text-primary)'
      }}>
        {value} <span style={{ fontSize: '1.5rem', color: 'var(--color-text-secondary)' }}>{unit}</span>
      </div>
      <div style={{ fontSize: '1.5rem', marginTop: '8px' }}>
        {trend === 'UP' ? '↑' : trend === 'DOWN' ? '↓' : '→'}
      </div>
    </div>
  );
};
