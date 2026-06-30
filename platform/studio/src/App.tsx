import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Node {
  id: string;
  type: 'StorageTank' | 'MixTank' | 'Pump' | 'Valve';
  name: string;
  x: number; y: number;
  status: 'Idle' | 'Running' | 'Fault';
  capacity: number;
  fillLevel: number;
  temperature: number;
  speedRpm: number;
  isOpen: boolean;
}

interface Pipe { id: string; fromId: string; toId: string; }

interface Snapshot { nodes: Node[]; pipes: Pipe[]; }

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const NODE_SIZE: Record<string, number> = {
  StorageTank: 100, MixTank: 110, Pump: 62, Valve: 62
};

const COLORS = {
  StorageTank: '#0ea5e9', MixTank: '#f59e0b',
  Pump: '#818cf8', Valve: '#f97316'
};

// Initial demo layout
const INIT_NODES: Node[] = [
  { id: 'ST-01', type: 'StorageTank', name: 'Raw Oil Tank',     x: 60,  y: 140, status: 'Idle', capacity: 1000, fillLevel: 820, temperature: 22, speedRpm: 0, isOpen: true },
  { id: 'PP-01', type: 'Pump',        name: 'Transfer Pump',    x: 255, y: 164, status: 'Idle', capacity: 0,    fillLevel: 0,   temperature: 0,  speedRpm: 1200, isOpen: true },
  { id: 'MT-01', type: 'MixTank',     name: 'Margarine Mixer',  x: 420, y: 120, status: 'Idle', capacity: 1200, fillLevel: 60,  temperature: 25, speedRpm: 0, isOpen: true },
  { id: 'VV-01', type: 'Valve',       name: 'Outlet Valve',     x: 635, y: 164, status: 'Idle', capacity: 0,    fillLevel: 0,   temperature: 0,  speedRpm: 0, isOpen: true },
];

const INIT_PIPES: Pipe[] = [
  { id: 'p1', fromId: 'ST-01', toId: 'PP-01' },
  { id: 'p2', fromId: 'PP-01', toId: 'MT-01' },
  { id: 'p3', fromId: 'MT-01', toId: 'VV-01' },
];

export default function App() {
  const [nodes, setNodes] = useState<Node[]>(INIT_NODES);
  const [pipes, setPipes] = useState<Pipe[]>(INIT_PIPES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Drag state
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);

  // Pipe drawing
  const [pipeFrom, setPipeFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Hovering pipe for delete highlight
  const [hoveredPipeId, setHoveredPipeId] = useState<string | null>(null);

  // Undo/Redo
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);

  const canvasRef = useRef<HTMLDivElement>(null);

  // ─── HISTORY HELPERS ───────────────────────────────────────────────────────
  const snapshot = useCallback(() => {
    return { nodes: nodes.map(n => ({ ...n })), pipes: pipes.map(p => ({ ...p })) };
  }, [nodes, pipes]);

  const pushHistory = useCallback(() => {
    setHistory(h => [...h.slice(-30), snapshot()]);
    setFuture([]);
  }, [snapshot]);

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture(f => [snapshot(), ...f]);
    setHistory(h => h.slice(0, -1));
    setNodes(prev.nodes);
    setPipes(prev.pipes);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(h => [...h, snapshot()]);
    setFuture(f => f.slice(1));
    setNodes(next.nodes);
    setPipes(next.pipes);
  };

  // ─── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        pushHistory();
        setNodes(n => n.filter(x => x.id !== selectedId));
        setPipes(p => p.filter(x => x.fromId !== selectedId && x.toId !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, history, future, nodes, pipes]);

  // ─── PHYSICS ENGINE ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSimulating) return;
    const timer = setInterval(() => {
      setNodes(prev => {
        const next = prev.map(n => ({ ...n }));
        pipes.forEach(pipe => {
          const from = next.find(n => n.id === pipe.fromId);
          const to = next.find(n => n.id === pipe.toId);
          if (!from || !to) return;

          const pumpDriving = (from.type === 'Pump' && from.status === 'Running') ||
                              (to.type === 'Pump' && to.status === 'Running');
          const valveBlocking = (from.type === 'Valve' && !from.isOpen) ||
                                (to.type === 'Valve' && !to.isOpen);
          const srcHasFluid = from.type !== 'Pump' && from.type !== 'Valve' ? from.fillLevel > 0 : true;
          const dstHasRoom = to.type !== 'Pump' && to.type !== 'Valve' ? to.fillLevel < to.capacity : true;

          if (pumpDriving && !valveBlocking && srcHasFluid && dstHasRoom) {
            const rate = 5;
            if (from.type === 'StorageTank' || from.type === 'MixTank')
              from.fillLevel = Math.max(0, from.fillLevel - rate);
            if (to.type === 'StorageTank' || to.type === 'MixTank')
              to.fillLevel = Math.min(to.capacity, to.fillLevel + rate);
            if (to.type === 'MixTank')
              to.temperature = Math.min(90, to.temperature + 0.3);
          }
        });
        return next;
      });
    }, 120);
    return () => clearInterval(timer);
  }, [isSimulating, pipes]);

  // ─── CANVAS EVENTS ─────────────────────────────────────────────────────────
  const getCanvasPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onCanvasMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasPos(e);
    setMousePos({ x, y });

    if (dragging) {
      const snap = 5;
      const newX = Math.round((x - dragging.ox) / snap) * snap;
      const newY = Math.round((y - dragging.oy) / snap) * snap;
      setNodes(prev => prev.map(n =>
        n.id === dragging.id ? { ...n, x: Math.max(10, newX), y: Math.max(10, newY) } : n
      ));
    }
  };

  const onCanvasMouseUp = () => {
    if (dragging) { pushHistory(); setDragging(null); }
    setPipeFrom(null);
  };

  // ─── NODE EVENTS ───────────────────────────────────────────────────────────
  const onNodeMouseDown = (n: Node, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedId(n.id);
    setDragging({ id: n.id, ox: e.clientX - n.x, oy: e.clientY - n.y });
  };

  // Drag from output port
  const onOutputPortMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPipeFrom(nodeId);
  };

  // Drop on input port
  const onInputPortMouseUp = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pipeFrom && pipeFrom !== nodeId) {
      const exists = pipes.some(p => p.fromId === pipeFrom && p.toId === nodeId);
      if (!exists) {
        pushHistory();
        setPipes(prev => [...prev, { id: `pipe-${Date.now()}`, fromId: pipeFrom, toId: nodeId }]);
      }
    }
    setPipeFrom(null);
  };

  // ─── SPAWN ─────────────────────────────────────────────────────────────────
  const spawnNode = (type: Node['type']) => {
    pushHistory();
    const defaults: Record<string, Partial<Node>> = {
      StorageTank: { capacity: 1000, fillLevel: 500, temperature: 0 },
      MixTank: { capacity: 1500, fillLevel: 0, temperature: 25 },
      Pump: { capacity: 0, fillLevel: 0, temperature: 0, speedRpm: 1200 },
      Valve: { capacity: 0, fillLevel: 0, temperature: 0, isOpen: true }
    };
    const names = { StorageTank: 'Tank', MixTank: 'Mixer', Pump: 'Pump', Valve: 'Valve' };
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      name: `${names[type]} ${nodes.length + 1}`,
      x: 120 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      status: 'Idle',
      speedRpm: 0,
      isOpen: true,
      capacity: 0, fillLevel: 0, temperature: 0,
      ...defaults[type]
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedId(newNode.id);
  };

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  const getPortPos = (nodeId: string, port: 'in' | 'out') => {
    const n = nodes.find(x => x.id === nodeId);
    if (!n) return { x: 0, y: 0 };
    const w = NODE_SIZE[n.type];
    return {
      x: n.x + (port === 'out' ? w : 0),
      y: n.y + w / 2
    };
  };

  const pipeHasFlow = (pipe: Pipe) => {
    const from = nodes.find(n => n.id === pipe.fromId);
    const to = nodes.find(n => n.id === pipe.toId);
    if (!from || !to) return false;
    const pumpRunning = (from.type === 'Pump' && from.status === 'Running') || (to.type === 'Pump' && to.status === 'Running');
    const valveBlocking = (from.type === 'Valve' && !from.isOpen) || (to.type === 'Valve' && !to.isOpen);
    return isSimulating && pumpRunning && !valveBlocking;
  };

  const selectedNode = nodes.find(n => n.id === selectedId);

  const setProp = (key: keyof Node, val: any) => {
    if (!selectedId) return;
    setNodes(prev => prev.map(n => n.id === selectedId ? { ...n, [key]: val } : n));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#07090f', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ━━━ HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header style={{ height: 56, background: '#0d1117', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'linear-gradient(135deg,#38bdf8,#818cf8)', width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', color: '#0f172a' }}>P</div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>PlantOS <span style={{ color: '#38bdf8', fontWeight: 400 }}>Studio</span></span>
          <div style={{ height: 20, width: 1, background: '#1e293b', margin: '0 4px' }} />
          <span style={{ fontSize: '0.72rem', color: '#64748b', background: '#1e293b', padding: '3px 8px', borderRadius: 5 }}>Paintbrush Canvas v1.2</span>
        </div>

        {/* Centre Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ToolBtn onClick={undo} disabled={history.length === 0} title="Undo (Ctrl+Z)">↩</ToolBtn>
          <ToolBtn onClick={redo} disabled={future.length === 0} title="Redo (Ctrl+Y)">↪</ToolBtn>
          <div style={{ width: 1, height: 20, background: '#1e293b', margin: '0 4px' }} />
          <span style={{ fontSize: '0.75rem', color: '#475569' }}>Nodes: {nodes.length} · Pipes: {pipes.length}</span>
        </div>

        <button
          onClick={() => setIsSimulating(v => !v)}
          style={{
            background: isSimulating ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#22c55e,#16a34a)',
            color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            boxShadow: isSimulating ? '0 0 16px rgba(239,68,68,0.4)' : '0 0 16px rgba(34,197,94,0.3)', transition: 'all 0.2s'
          }}
        >
          {isSimulating ? '■ STOP SIMULATOR' : '▶ START SIMULATOR'}
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* ━━━ LEFT PANEL: MACHINERY TOOLBAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <aside style={{ width: 272, background: '#0b1018', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: 0.8 }}>
            MACHINERY — Click to Place
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
            {([
              { type: 'StorageTank', label: 'Storage Tank', sub: '🛢️ Liquid buffer, input source', color: '#0ea5e9' },
              { type: 'MixTank',     label: 'Mixer Vessel',  sub: '🌀 Heating + Agitation',       color: '#f59e0b' },
              { type: 'Pump',        label: 'Centrifugal Pump', sub: '⚙️ Drives fluid flow',      color: '#818cf8' },
              { type: 'Valve',       label: 'Flow Valve',    sub: '🛑 Open / Close flow path',    color: '#f97316' },
            ] as const).map(({ type, label, sub, color }) => (
              <MachineryCard key={type} color={color} label={label} sub={sub} onClick={() => spawnNode(type)} />
            ))}
          </div>

          {/* Hints Panel */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid #1e293b', background: '#07090f', fontSize: '0.72rem', color: '#475569', lineHeight: '1.6' }}>
            <div style={{ marginBottom: 6, color: '#64748b', fontWeight: 700 }}>KEYBOARD SHORTCUTS</div>
            <div><kbd style={kbdStyle}>Del</kbd> Delete selected</div>
            <div><kbd style={kbdStyle}>Ctrl+Z</kbd> Undo</div>
            <div><kbd style={kbdStyle}>Ctrl+Y</kbd> Redo</div>
            <div style={{ marginTop: 10, color: '#64748b', fontWeight: 700 }}>DRAW PIPELINE</div>
            <div>Drag from <span style={{ color: '#38bdf8' }}>●</span> (right) onto <span style={{ color: '#38bdf8' }}>○</span> (left).</div>
            <div>Click any pipe to delete it.</div>
          </div>
        </aside>

        {/* ━━━ CANVAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div
          ref={canvasRef}
          style={{
            flex: 1, position: 'relative', overflow: 'hidden',
            background: '#07090f',
            backgroundImage: 'radial-gradient(rgba(30,41,59,0.7) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            cursor: dragging ? 'grabbing' : pipeFrom ? 'crosshair' : 'default'
          }}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onClick={() => setSelectedId(null)}
        >
          {/* SVG Layer — Pipes */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
            <defs>
              <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {pipes.map(pipe => {
              const start = getPortPos(pipe.fromId, 'out');
              const end   = getPortPos(pipe.toId, 'in');
              const flow  = pipeHasFlow(pipe);
              const hovered = hoveredPipeId === pipe.id;

              // Bezier curve path
              const cx = (start.x + end.x) / 2;
              const d  = `M ${start.x} ${start.y} C ${cx} ${start.y}, ${cx} ${end.y}, ${end.x} ${end.y}`;

              return (
                <g key={pipe.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPipeId(pipe.id)}
                  onMouseLeave={() => setHoveredPipeId(null)}
                  onClick={e => {
                    e.stopPropagation();
                    pushHistory();
                    setPipes(prev => prev.filter(p => p.id !== pipe.id));
                    if (hoveredPipeId === pipe.id) setHoveredPipeId(null);
                  }}>
                  {/* Hit area (wider, invisible) */}
                  <path d={d} fill="none" stroke="transparent" strokeWidth={16} />
                  {/* Pipe tube */}
                  <path d={d} fill="none" stroke={hovered ? '#ef4444' : '#1e293b'} strokeWidth={10} strokeLinecap="round" />
                  {/* Fluid core */}
                  <path d={d} fill="none"
                    stroke={hovered ? '#fca5a5' : 'url(#flowGrad)'}
                    strokeWidth={4} strokeLinecap="round"
                    strokeDasharray={flow ? '10 8' : undefined}
                    filter={flow ? 'url(#glow)' : undefined}
                    style={{ animation: flow ? 'dash 1s linear infinite' : 'none', opacity: flow ? 1 : hovered ? 0.6 : 0.25, transition: 'opacity 0.3s' }}
                  />
                  {/* Delete hint on hover */}
                  {hovered && (() => {
                    const mx = (start.x + end.x) / 2;
                    const my = (start.y + end.y) / 2;
                    return (
                      <g>
                        <circle cx={mx} cy={my} r={10} fill="#ef4444" />
                        <text x={mx} y={my + 4.5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">×</text>
                      </g>
                    );
                  })()}
                </g>
              );
            })}

            {/* Live pipe being drawn */}
            {pipeFrom && (() => {
              const start = getPortPos(pipeFrom, 'out');
              const cx = (start.x + mousePos.x) / 2;
              const d = `M ${start.x} ${start.y} C ${cx} ${start.y}, ${cx} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`;
              return (
                <path d={d} fill="none" stroke="#38bdf8" strokeWidth={3} strokeDasharray="7 5" strokeLinecap="round"
                  style={{ animation: 'dash 0.8s linear infinite', opacity: 0.85 }} />
              );
            })()}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const w = NODE_SIZE[node.type];
            const isSelected = node.id === selectedId;
            const color = COLORS[node.type];
            const isRound = node.type === 'Pump' || node.type === 'Valve';

            return (
              <div
                key={node.id}
                onMouseDown={e => onNodeMouseDown(node, e)}
                style={{
                  position: 'absolute', left: node.x, top: node.y,
                  width: w, height: w,
                  background: '#0d1117',
                  border: isSelected ? `2px solid ${color}` : '1.5px solid #1e293b',
                  borderRadius: isRound ? '50%' : 14,
                  boxShadow: isSelected ? `0 0 24px ${color}40` : '0 4px 12px rgba(0,0,0,0.4)',
                  cursor: dragging?.id === node.id ? 'grabbing' : 'grab',
                  zIndex: isSelected ? 10 : 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  userSelect: 'none',
                  transition: dragging?.id === node.id ? 'none' : 'box-shadow 0.2s, border-color 0.2s',
                  overflow: 'visible'
                }}
              >
                {/* ── INPUT PORT (left) ── */}
                <div
                  onMouseUp={e => onInputPortMouseUp(node.id, e)}
                  title="Input port — drop pipe here"
                  style={{
                    position: 'absolute', left: -9, top: '50%', transform: 'translateY(-50%)',
                    width: 16, height: 16, borderRadius: '50%',
                    border: `2px solid ${color}`, background: '#07090f',
                    cursor: 'crosshair', zIndex: 20
                  }}
                />

                {/* ── OUTPUT PORT (right) ── */}
                <div
                  onMouseDown={e => onOutputPortMouseDown(node.id, e)}
                  title="Drag to draw pipeline"
                  style={{
                    position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)',
                    width: 16, height: 16, borderRadius: '50%',
                    background: color, border: '2px solid #07090f',
                    cursor: 'crosshair', zIndex: 20
                  }}
                />

                {/* ── BODY CONTENT ── */}
                <NodeBody node={node} onToggleValve={() => setProp('isOpen', !node.isOpen)} />

                {/* ── STATUS BADGE ── */}
                <StatusBadge status={node.status} />

                {/* ── DELETE × ── */}
                {isSelected && (
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation();
                      pushHistory();
                      setNodes(n => n.filter(x => x.id !== node.id));
                      setPipes(p => p.filter(x => x.fromId !== node.id && x.toId !== node.id));
                      setSelectedId(null);
                    }}
                    style={{
                      position: 'absolute', top: -12, right: -12, width: 22, height: 22,
                      borderRadius: '50%', background: '#ef4444', color: '#fff',
                      border: '2px solid #07090f', fontSize: '0.8rem', fontWeight: 900,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)', zIndex: 30
                    }}>×</button>
                )}
              </div>
            );
          })}
        </div>

        {/* ━━━ RIGHT PANEL: PROPERTY INSPECTOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <aside style={{ width: 300, background: '#0b1018', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: 0.8 }}>
            INSPECTOR
          </div>

          {selectedNode ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Type badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[selectedNode.type] }} />
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{selectedNode.type.toUpperCase()}</span>
              </div>

              <Field label="NAME">
                <input value={selectedNode.name} onChange={e => setProp('name', e.target.value)}
                  style={inputStyle} />
              </Field>

              <Field label="STATUS">
                <select value={selectedNode.status} onChange={e => setProp('status', e.target.value as any)}
                  style={inputStyle}>
                  <option value="Idle">🟡 Idle</option>
                  <option value="Running">🟢 Running</option>
                  <option value="Fault">🔴 Fault</option>
                </select>
              </Field>

              {(selectedNode.type === 'StorageTank' || selectedNode.type === 'MixTank') && (<>
                <Field label={`CAPACITY (L)`}>
                  <input type="number" value={selectedNode.capacity} onChange={e => setProp('capacity', +e.target.value)} style={inputStyle} />
                </Field>
                <Field label={`FILL LEVEL — ${Math.round(selectedNode.fillLevel)}L`}>
                  <input type="range" min={0} max={selectedNode.capacity} value={selectedNode.fillLevel}
                    onChange={e => setProp('fillLevel', +e.target.value)}
                    style={{ width: '100%', cursor: 'pointer', accentColor: COLORS[selectedNode.type] }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#475569' }}>
                    <span>0</span><span>{selectedNode.capacity}L</span>
                  </div>
                </Field>
              </>)}

              {selectedNode.type === 'MixTank' && (
                <Field label={`TEMPERATURE — ${selectedNode.temperature.toFixed(1)}°C`}>
                  <input type="range" min={0} max={150} value={selectedNode.temperature}
                    onChange={e => setProp('temperature', +e.target.value)}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#f59e0b' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#475569' }}>
                    <span>0°C</span><span>150°C</span>
                  </div>
                </Field>
              )}

              {selectedNode.type === 'Pump' && (
                <Field label="FLOW RATE (RPM)">
                  <input type="number" value={selectedNode.speedRpm} onChange={e => setProp('speedRpm', +e.target.value)} style={inputStyle} />
                </Field>
              )}

              {selectedNode.type === 'Valve' && (
                <Field label="VALVE POSITION">
                  <button onClick={() => setProp('isOpen', !selectedNode.isOpen)}
                    style={{
                      width: '100%', padding: '9px', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
                      background: selectedNode.isOpen ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      color: selectedNode.isOpen ? '#22c55e' : '#ef4444',
                      border: `1px solid ${selectedNode.isOpen ? '#22c55e' : '#ef4444'}`, transition: 'all 0.2s'
                    }}>
                    {selectedNode.isOpen ? '🟢 FULLY OPEN' : '🔴 FULLY CLOSED'}
                  </button>
                </Field>
              )}

              <div style={{ marginTop: 6, paddingTop: 14, borderTop: '1px solid #1e293b' }}>
                <button onClick={() => { pushHistory(); setNodes(n => n.filter(x => x.id !== selectedId)); setPipes(p => p.filter(x => x.fromId !== selectedId && x.toId !== selectedId)); setSelectedId(null); }}
                  style={{ width: '100%', padding: '8px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  🗑️ Delete this Unit
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 24, color: '#334155', fontSize: '0.85rem', textAlign: 'center', marginTop: 40 }}>
              Click any machinery on the canvas to configure its properties here.
            </div>
          )}
        </aside>
      </div>

      <style>{`
        @keyframes dash { to { stroke-dashoffset: -20; } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
      `}</style>
    </div>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function NodeBody({ node, onToggleValve }: { node: Node; onToggleValve: () => void }) {
  const w = NODE_SIZE[node.type];

  if (node.type === 'StorageTank' || node.type === 'MixTank') {
    const pct = node.capacity > 0 ? (node.fillLevel / node.capacity) * 100 : 0;
    const fillColor = node.type === 'MixTank' ? '#f59e0b' : '#0ea5e9';
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px 10px 8px', overflow: 'hidden', borderRadius: 12 }}>
        {/* Fill gauge */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: `${pct}%`, background: fillColor, opacity: 0.35, borderRadius: '0 0 12px 12px', transition: 'height 0.12s ease' }} />
        {/* Fill ripple */}
        {pct > 5 && (
          <div style={{ position: 'absolute', bottom: `${pct}%`, left: 0, width: '100%', height: 3, background: fillColor, opacity: 0.7, borderRadius: 2 }} />
        )}
        <div style={{ zIndex: 1, fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {node.name}
        </div>
        <div style={{ zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f8fafc' }}>{Math.round(node.fillLevel)}<span style={{ fontSize: '0.65rem', color: '#64748b' }}>L</span></div>
          {node.type === 'MixTank' && <div style={{ fontSize: '0.65rem', color: '#fcd34d', marginTop: 1 }}>🌡 {node.temperature.toFixed(1)}°C</div>}
        </div>
      </div>
    );
  }

  if (node.type === 'Pump') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <span style={{ fontSize: '1.5rem', display: 'block', animation: node.status === 'Running' ? 'spin 1.1s linear infinite' : 'none' }}>⚙️</span>
        <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, maxWidth: 48, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</span>
      </div>
    );
  }

  // Valve
  return (
    <div onClick={e => { e.stopPropagation(); onToggleValve(); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}>
      <span style={{ fontSize: '1.4rem', filter: node.isOpen ? 'drop-shadow(0 0 6px #22c55e)' : 'drop-shadow(0 0 6px #ef4444)' }}>{node.isOpen ? '🟢' : '🔴'}</span>
      <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, maxWidth: 48, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map = { Running: ['#22c55e', '⟳'], Fault: ['#ef4444', '!'], Idle: ['#475569', '—'] } as Record<string, [string, string]>;
  const [color, icon] = map[status] || ['#475569', '—'];
  if (status === 'Idle') return null;
  return (
    <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', background: color, color: '#fff', fontSize: '0.6rem', fontWeight: 900, padding: '2px 7px', borderRadius: 10, boxShadow: `0 0 8px ${color}88`, animation: status === 'Fault' ? 'pulse 1s infinite' : 'none', whiteSpace: 'nowrap', zIndex: 20 }}>
      {icon} {status.toUpperCase()}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.68rem', color: '#475569', fontWeight: 800, marginBottom: 5, letterSpacing: 0.4 }}>{label}</label>
      {children}
    </div>
  );
}

function ToolBtn({ children, onClick, disabled, title }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{ background: '#1e293b', color: disabled ? '#334155' : '#94a3b8', border: '1px solid #334155', borderRadius: 6, width: 32, height: 30, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
      {children}
    </button>
  );
}

function MachineryCard({ color, label, sub, onClick }: { color: string; label: string; sub: string; onClick: () => void }) {
  return (
    <div onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 10, background: '#0d1117', border: '1px solid #1e293b', cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = color; (e.currentTarget as HTMLDivElement).style.background = `${color}08`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1e293b'; (e.currentTarget as HTMLDivElement).style.background = '#0d1117'; }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
        {sub.split(' ')[0]}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e2e8f0' }}>{label}</div>
        <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 1 }}>{sub.split(' ').slice(1).join(' ')}</div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d1117', border: '1px solid #1e293b', borderRadius: 7,
  padding: '8px 11px', color: '#f8fafc', fontSize: '0.83rem', outline: 'none'
};

const kbdStyle: React.CSSProperties = {
  background: '#1e293b', color: '#94a3b8', padding: '1px 5px', borderRadius: 4,
  fontSize: '0.7rem', marginRight: 4, border: '1px solid #334155'
};
