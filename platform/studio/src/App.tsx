import React, { useState, useEffect, useRef } from 'react';

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────
interface Node {
  id: string;
  type: 'StorageTank' | 'MixTank' | 'Pump' | 'Valve';
  name: string;
  x: number;
  y: number;
  status: 'Idle' | 'Running' | 'Fault';
  capacity: number;     // for tanks (Litres)
  fillLevel: number;    // current fluid volume
  temperature: number;  // for MixTank (°C)
  speedRpm: number;     // for Pump (RPM)
  isOpen: boolean;      // for Valve
}

interface Connection {
  id: string;
  fromId: string;
  toId: string;
  active: boolean;
}

type ToolMode = 'select' | 'add_storage' | 'add_mix' | 'add_pump' | 'add_valve' | 'pipe' | 'erase';

export default function App() {
  // ─── INITIAL SYSTEM STATE ──────────────────────────────────────────────────
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'ST-01', type: 'StorageTank', name: 'Raw Oil Tank', x: 100, y: 150, status: 'Idle', capacity: 1000, fillLevel: 800, temperature: 22, speedRpm: 0, isOpen: true },
    { id: 'PP-01', type: 'Pump', name: 'Transfer Pump', x: 280, y: 170, status: 'Idle', capacity: 0, fillLevel: 0, temperature: 0, speedRpm: 1200, isOpen: true },
    { id: 'MT-01', type: 'MixTank', name: 'Margarine Mixer', x: 440, y: 130, status: 'Idle', capacity: 1200, fillLevel: 50, temperature: 25, speedRpm: 0, isOpen: true },
    { id: 'VV-01', type: 'Valve', name: 'Control Valve', x: 620, y: 180, status: 'Idle', capacity: 0, fillLevel: 0, temperature: 0, speedRpm: 0, isOpen: true }
  ]);

  const [connections, setConnections] = useState<Connection[]>([
    { id: 'pipe-1', fromId: 'ST-01', toId: 'PP-01', active: false },
    { id: 'pipe-2', fromId: 'PP-01', toId: 'MT-01', active: false },
    { id: 'pipe-3', fromId: 'MT-01', toId: 'VV-01', active: false }
  ]);

  const [mode, setMode] = useState<ToolMode>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pipeStartId, setPipeStartId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Dragging states
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // ─── FACTORY PHYSICS SIMULATION ENGINE ─────────────────────────────────────
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSimulating) {
      timer = setInterval(() => {
        setNodes((prevNodes) => {
          // Deep clone nodes to prevent mutation bugs
          const next = prevNodes.map(n => ({ ...n }));

          // Basic physics step:
          // 1. If pump is running, we move liquid from tanks connected to its inputs to its outputs.
          connections.forEach(conn => {
            const source = next.find(n => n.id === conn.fromId);
            const dest = next.find(n => n.id === conn.toId);

            if (!source || !dest) return;

            // Check if there is flow pathway:
            // Source must have liquid, destination must have capacity, valves in path must be open
            const isSourceValid = source.type === 'StorageTank' || source.type === 'MixTank' ? source.fillLevel > 0 : true;
            const isDestValid = dest.type === 'StorageTank' || dest.type === 'MixTank' ? dest.fillLevel < dest.capacity : true;
            
            // Check if there is an active pump driving this connection line
            const isDriven = source.type === 'Pump' && source.status === 'Running' || 
                             dest.type === 'Pump' && dest.status === 'Running';
            
            const isValveOpen = source.type === 'Valve' ? source.isOpen : true;

            if (isDriven && isSourceValid && isDestValid && isValveOpen) {
              const transferAmount = 5; // litres per tick

              // Flow from source tank
              if (source.type === 'StorageTank' || source.type === 'MixTank') {
                source.fillLevel = Math.max(0, source.fillLevel - transferAmount);
              }
              // Flow to dest tank
              if (dest.type === 'StorageTank' || dest.type === 'MixTank') {
                dest.fillLevel = Math.min(dest.capacity, dest.fillLevel + transferAmount);
              }

              // Warm up mixture in the mixer
              if (dest.type === 'MixTank') {
                dest.temperature = Math.min(80, dest.temperature + 0.3); // heat up
              }
            }
          });

          return next;
        });
      }, 200);
    }
    return () => clearInterval(timer);
  }, [isSimulating, connections]);

  // ─── USER INTERACTION HANDLERS ─────────────────────────────────────────────
  
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = Math.round((e.clientX - rect.left) / 10) * 10; // Snap to 10px grid
    const clickY = Math.round((e.clientY - rect.top) / 10) * 10;

    // Handle Adding Nodes based on ToolMode
    if (mode !== 'select' && mode !== 'pipe' && mode !== 'erase') {
      const typeMap: Record<string, 'StorageTank' | 'MixTank' | 'Pump' | 'Valve'> = {
        add_storage: 'StorageTank',
        add_mix: 'MixTank',
        add_pump: 'Pump',
        add_valve: 'Valve'
      };

      const nameMap = {
        add_storage: 'Storage Tank',
        add_mix: 'Mixer Vessel',
        add_pump: 'Feed Pump',
        add_valve: 'Gate Valve'
      };

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: typeMap[mode],
        name: `${nameMap[mode]} ${nodes.length + 1}`,
        x: clickX,
        y: clickY,
        status: 'Idle',
        capacity: mode.includes('tank') || mode.includes('mix') || mode.includes('storage') ? 1000 : 0,
        fillLevel: 0,
        temperature: mode === 'add_mix' ? 25 : 0,
        speedRpm: mode === 'add_pump' ? 1000 : 0,
        isOpen: true
      };

      // Correct custom capacity for different types
      if (newNode.type === 'MixTank') newNode.capacity = 1500;

      setNodes(prev => [...prev, newNode]);
      setMode('select'); // Switch back to pointer
      setSelectedId(newNode.id);
    }
  };

  const handleNodeMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'erase') {
      // Remove Node & any connected pipes
      setNodes(prev => prev.filter(n => n.id !== id));
      setConnections(prev => prev.filter(c => c.fromId !== id && c.toId !== id));
      if (selectedId === id) setSelectedId(null);
      return;
    }

    if (mode === 'pipe') {
      if (!pipeStartId) {
        setPipeStartId(id);
      } else {
        if (pipeStartId !== id) {
          // Connect nodes
          const newPipe: Connection = {
            id: `pipe-${Date.now()}`,
            fromId: pipeStartId,
            toId: id,
            active: false
          };
          setConnections(prev => [...prev, newPipe]);
        }
        setPipeStartId(null);
        setMode('select');
      }
      return;
    }

    if (mode === 'select') {
      setSelectedId(id);
      setDraggingId(id);
      const node = nodes.find(n => n.id === id);
      if (node) {
        setDragOffset({
          x: e.clientX - node.x,
          y: e.clientY - node.y
        });
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (draggingId && mode === 'select') {
      const node = nodes.find(n => n.id === draggingId);
      if (node && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const rawX = e.clientX - rect.left - dragOffset.x;
        const rawY = e.clientY - rect.top - dragOffset.y;
        
        // Snapped movement to 10px grid
        const newX = Math.max(20, Math.min(rect.width - 100, Math.round(rawX / 10) * 10));
        const newY = Math.max(20, Math.min(rect.height - 100, Math.round(rawY / 10) * 10));

        setNodes(prev => prev.map(n => n.id === draggingId ? { ...n, x: newX, y: newY } : n));
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingId(null);
  };

  const handleConnClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'erase') {
      setConnections(prev => prev.filter(c => c.id !== id));
    }
  };

  const handlePropertyChange = (key: keyof Node, value: any) => {
    if (!selectedId) return;
    setNodes(prev => prev.map(n => n.id === selectedId ? { ...n, [key]: value } : n));
  };

  const selectedNode = nodes.find(n => n.id === selectedId);

  return (
    <div className="studio-layout" style={{ background: '#090d16', color: '#e2e8f0', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* ─── PREMIUM TOOLBAR/HEADER ────────────────────────────────────────── */}
      <header className="studio-header" style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', height: 60, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#38bdf8', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#0f172a' }}>P</div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: -0.5 }}>PlantOS</span>
            <span style={{ color: '#38bdf8', marginLeft: 6, fontSize: '0.85rem', background: '#38bdf822', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>Paintbrush Factory OS</span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            className="btn" 
            onClick={() => setIsSimulating(!isSimulating)}
            style={{
              background: isSimulating ? '#ef444422' : '#22c55e22',
              color: isSimulating ? '#ef4444' : '#22c55e',
              border: `1px solid ${isSimulating ? '#ef4444' : '#22c55e'}`,
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {isSimulating ? '■ STOP SIMULATION' : '▶ RUN FACTORY'}
          </button>
        </div>
      </header>

      {/* ─── MAIN WORKSPACE ────────────────────────────────────────────────── */}
      <div className="studio-main" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: PAINTBRUSH TOOLBOX */}
        <aside className="studio-sidebar" style={{ width: 280, background: '#0b0f19', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
          <div className="studio-sidebar-header" style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', fontWeight: 700, color: '#94a3b8', fontSize: '0.85rem' }}>
            MACHINERY PAINTBOX
          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
            
            <div style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, marginTop: 8, marginBottom: 4, letterSpacing: 0.5 }}>TOOLS</div>
            <button 
              onClick={() => setMode('select')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid #1e293b', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left', fontWeight: 600,
                background: mode === 'select' ? '#38bdf822' : 'transparent', color: mode === 'select' ? '#38bdf8' : '#94a3b8'
              }}
            >
              <span>🖱️</span> Pointer (Move / Select)
            </button>

            <button 
              onClick={() => setMode('pipe')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid #1e293b', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left', fontWeight: 600,
                background: mode === 'pipe' ? '#a855f722' : 'transparent', color: mode === 'pipe' ? '#c084fc' : '#94a3b8'
              }}
            >
              <span>🧪</span> Draw Pipeline (Connect)
            </button>

            <button 
              onClick={() => setMode('erase')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid #1e293b', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left', fontWeight: 600,
                background: mode === 'erase' ? '#ef444422' : 'transparent', color: mode === 'erase' ? '#f87171' : '#94a3b8'
              }}
            >
              <span>🧽</span> Eraser tool
            </button>

            <div style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, marginTop: 16, marginBottom: 4, letterSpacing: 0.5 }}>ADD MACHINERY</div>
            
            <button 
              onClick={() => setMode('add_storage')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid #1e293b', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left', fontWeight: 600,
                background: mode === 'add_storage' ? '#22c55e22' : 'transparent', color: mode === 'add_storage' ? '#4ade80' : '#94a3b8'
              }}
            >
              <span>🛢️</span> Raw Storage Tank
            </button>

            <button 
              onClick={() => setMode('add_mix')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid #1e293b', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left', fontWeight: 600,
                background: mode === 'add_mix' ? '#eab30822' : 'transparent', color: mode === 'add_mix' ? '#facc15' : '#94a3b8'
              }}
            >
              <span>🌀</span> Mixing & Heating Vessel
            </button>

            <button 
              onClick={() => setMode('add_pump')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid #1e293b', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left', fontWeight: 600,
                background: mode === 'add_pump' ? '#3b82f622' : 'transparent', color: mode === 'add_pump' ? '#60a5fa' : '#94a3b8'
              }}
            >
              <span>⚙️</span> Centrifugal Pump
            </button>

            <button 
              onClick={() => setMode('add_valve')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid #1e293b', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left', fontWeight: 600,
                background: mode === 'add_valve' ? '#f9731622' : 'transparent', color: mode === 'add_valve' ? '#fb923c' : '#94a3b8'
              }}
            >
              <span>🛑</span> Solenoid Flow Valve
            </button>

          </div>
          <div style={{ padding: 20, borderTop: '1px solid #1e293b', background: '#090d16', fontSize: '0.75rem', color: '#64748b' }}>
            <strong>Usage Tip:</strong> Select a machinery from the sidebar, click anywhere on the grid canvas to draw it. Use "Draw Pipeline" and click two nodes sequentially to connect them.
          </div>
        </aside>

        {/* Center: CANVAS DRAWING BOARD */}
        <section 
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          className="studio-canvas-container" 
          style={{ 
            flex: 1, 
            position: 'relative', 
            overflow: 'hidden', 
            background: '#090c15', 
            backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', 
            backgroundSize: '24px 24px',
            cursor: mode === 'pipe' ? 'crosshair' : mode === 'erase' ? 'cell' : 'default'
          }}
        >
          {/* Active Tool Mode Overlay */}
          <div style={{ position: 'absolute', top: 16, left: 16, background: '#0f172acc', backdropFilter: 'blur(8px)', border: '1px solid #1e293b', borderRadius: 8, padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', zIndex: 10 }}>
            MODE: {mode.toUpperCase().replace('_', ' ')}
            {pipeStartId && ` (Connecting from ${pipeStartId})`}
          </div>

          {/* SVG Pipelines Drawing Layer */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              {/* Pipe animation gradient */}
              <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>

            {connections.map(conn => {
              const from = nodes.find(n => n.id === conn.fromId);
              const to = nodes.find(n => n.id === conn.toId);
              if (!from || !to) return null;

              // Connect center coordinates
              const fromX = from.x + (from.type === 'Pump' || from.type === 'Valve' ? 25 : 45);
              const fromY = from.y + (from.type === 'Pump' || from.type === 'Valve' ? 25 : 45);
              const toX = to.x + (to.type === 'Pump' || to.type === 'Valve' ? 25 : 45);
              const toY = to.y + (to.type === 'Pump' || to.type === 'Valve' ? 25 : 45);

              // Calculate pipe flow state: active if simulating and either pump is running
              const sourcePumpActive = from.type === 'Pump' && from.status === 'Running';
              const destPumpActive = to.type === 'Pump' && to.status === 'Running';
              const isValveClosed = (from.type === 'Valve' && !from.isOpen) || (to.type === 'Valve' && !to.isOpen);
              const hasFlow = isSimulating && (sourcePumpActive || destPumpActive) && !isValveClosed;

              return (
                <g key={conn.id} style={{ pointerEvents: 'auto', cursor: mode === 'erase' ? 'pointer' : 'default' }} onClick={(e) => handleConnClick(conn.id, e)}>
                  {/* Background pipe tube */}
                  <line 
                    x1={fromX} y1={fromY} x2={toX} y2={toY} 
                    stroke="#1e293b" strokeWidth="8" strokeLinecap="round" 
                  />
                  {/* Fluid flow line */}
                  <line 
                    x1={fromX} y1={fromY} x2={toX} y2={toY} 
                    stroke="url(#flowGrad)" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={hasFlow ? "8, 6" : "none"}
                    style={{
                      animation: hasFlow ? 'dash 1s linear infinite' : 'none',
                      opacity: hasFlow ? 1 : 0.2,
                      transition: 'opacity 0.5s ease'
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Render Machinery Elements */}
          {nodes.map(node => {
            const isSelected = node.id === selectedId;
            const size = node.type === 'Pump' || node.type === 'Valve' ? 50 : 90;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  width: size,
                  height: size,
                  background: node.type === 'Pump' || node.type === 'Valve' ? '#1e293b' : '#0f172a',
                  border: isSelected ? '2px solid #38bdf8' : '1px solid #334155',
                  borderRadius: node.type === 'Pump' ? '50%' : '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: mode === 'select' ? 'grab' : 'pointer',
                  userSelect: 'none',
                  boxShadow: isSelected ? '0 0 16px #38bdf844' : 'none',
                  zIndex: 2,
                  padding: 8
                }}
              >
                {/* Visual content for Tank */}
                {(node.type === 'StorageTank' || node.type === 'MixTank') && (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                    {/* Liquid fill gauge */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: `${(node.fillLevel / node.capacity) * 100}%`,
                      background: node.type === 'MixTank' ? 'linear-gradient(to top, #fbbf24 30%, #f59e0b)' : 'linear-gradient(to top, #0284c7 30%, #38bdf8)',
                      borderRadius: '0 0 10px 10px',
                      opacity: 0.6,
                      transition: 'height 0.3s ease'
                    }} />
                    
                    {/* Tank Details Label */}
                    <div style={{ zIndex: 1, fontSize: '0.7rem', fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                      {node.name}
                    </div>

                    <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>
                        {Math.round(node.fillLevel)}L
                      </span>
                      {node.type === 'MixTank' && (
                        <span style={{ fontSize: '0.65rem', color: '#fcd34d', fontWeight: 600 }}>
                          🌡️ {node.temperature.toFixed(1)}°C
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Visual content for Pump */}
                {node.type === 'Pump' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <div 
                      style={{ 
                        fontSize: '1.25rem', 
                        animation: node.status === 'Running' ? 'spin 1.5s linear infinite' : 'none',
                        display: 'inline-block'
                      }}
                    >
                      ⚙️
                    </div>
                    <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: 2, fontWeight: 700 }}>
                      {node.name}
                    </div>
                  </div>
                )}

                {/* Visual content for Valve */}
                {node.type === 'Valve' && (
                  <div 
                    onClick={() => {
                      if (mode === 'select') {
                        handlePropertyChange('isOpen', !node.isOpen);
                      }
                    }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '1.2rem' }}>
                      {node.isOpen ? '🟢' : '🔴'}
                    </div>
                    <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: 2, fontWeight: 700 }}>
                      {node.name}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Right Side: PROPERTY INSPECTOR */}
        <aside className="studio-inspector" style={{ width: 320, background: '#0b0f19', borderLeft: '1px solid #1e293b', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="studio-sidebar-header" style={{ padding: '0 0 12px 0', borderBottom: '1px solid #1e293b', fontWeight: 700, color: '#94a3b8', fontSize: '0.85rem' }}>
            MACHINERY INSPECTOR
          </div>

          {selectedNode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 6 }}>NAME</label>
                <input 
                  type="text" 
                  value={selectedNode.name}
                  onChange={(e) => handlePropertyChange('name', e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: 6, color: '#e2e8f0', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 6 }}>TYPE</label>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: 6, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
                  {selectedNode.type}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 6 }}>STATUS</label>
                <select 
                  value={selectedNode.status}
                  onChange={(e) => handlePropertyChange('status', e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: 6, color: '#e2e8f0', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <option value="Idle">🟡 Idle</option>
                  <option value="Running">🟢 Running</option>
                  <option value="Fault">🔴 Fault</option>
                </select>
              </div>

              {/* Tank Specific Settings */}
              {(selectedNode.type === 'StorageTank' || selectedNode.type === 'MixTank') && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 6 }}>CAPACITY (L)</label>
                    <input 
                      type="number" 
                      value={selectedNode.capacity}
                      onChange={(e) => handlePropertyChange('capacity', Number(e.target.value))}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: 6, color: '#e2e8f0', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 6 }}>FILL LEVEL (L)</label>
                    <input 
                      type="range" 
                      min="0"
                      max={selectedNode.capacity}
                      value={selectedNode.fillLevel}
                      onChange={(e) => handlePropertyChange('fillLevel', Number(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                      {Math.round(selectedNode.fillLevel)} / {selectedNode.capacity} Litres
                    </div>
                  </div>
                </>
              )}

              {/* Mixer Vessel Temperature Settings */}
              {selectedNode.type === 'MixTank' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 6 }}>HEATER TEMPERATURE (°C)</label>
                  <input 
                    type="number" 
                    value={selectedNode.temperature.toFixed(1)}
                    onChange={(e) => handlePropertyChange('temperature', Number(e.target.value))}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: 6, color: '#e2e8f0', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              {/* Pump Settings */}
              {selectedNode.type === 'Pump' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 6 }}>PUMP SPEED (RPM)</label>
                  <input 
                    type="number" 
                    value={selectedNode.speedRpm}
                    onChange={(e) => handlePropertyChange('speedRpm', Number(e.target.value))}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: 6, color: '#e2e8f0', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              {/* Valve Settings */}
              {selectedNode.type === 'Valve' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 6 }}>VALVE STATE</label>
                  <button 
                    onClick={() => handlePropertyChange('isOpen', !selectedNode.isOpen)}
                    style={{
                      width: '100%', padding: '10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                      background: selectedNode.isOpen ? '#22c55e22' : '#ef444422',
                      color: selectedNode.isOpen ? '#22c55e' : '#ef4444',
                      border: `1px solid ${selectedNode.isOpen ? '#22c55e' : '#ef4444'}`
                    }}
                  >
                    {selectedNode.isOpen ? 'VALVE: OPEN' : 'VALVE: CLOSED'}
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div style={{ color: '#475569', fontSize: '0.85rem', textAlign: 'center', marginTop: 40 }}>
              Select a machinery node on the canvas to inspect & configure its parameter set.
            </div>
          )}
        </aside>

      </div>

      {/* ─── ADD STYLE ANIMATIONS FOR SVG & SPINNING ────────────────────────── */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}} />
    </div>
  );
}
