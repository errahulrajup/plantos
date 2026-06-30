import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000/ws/telemetry';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Equipment {
  id: string;
  state: string;
  telemetry?: { temperature: number; pressure: number; rpm: number; flowRate: number; };
  workOrders?: number;
}
interface WorkOrder {
  id: string; equipmentId: string; description: string;
  priority: string; status: string; createdAt: string;
}

// ─── State color map ──────────────────────────────────────────────────────────
const stateColor: Record<string, string> = {
  Running: '#00e676', Fault: '#ff1744', Offline: '#555',
  Idle: '#ffc400', Starting: '#40c4ff', Stopping: '#ff6d00',
  Stopped: '#b0bec5', Holding: '#ce93d8', Maintenance: '#ff9800'
};
const stateIcon: Record<string, string> = {
  Running: '🟢', Fault: '🔴', Offline: '⚫',
  Idle: '🟡', Starting: '🔵', Stopping: '🟠',
  Stopped: '⚪', Holding: '🟣', Maintenance: '🟠'
};

// ─── Components ───────────────────────────────────────────────────────────────
function StatCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8, padding: '12px 16px', minWidth: 100 }}>
      <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#e0e0e0', fontSize: 22, fontWeight: 700 }}>{typeof value === 'number' ? value.toFixed(1) : value} <span style={{ fontSize: 12, color: '#666' }}>{unit}</span></div>
    </div>
  );
}

function EquipmentCard({ eq, token, onCommand }: { eq: Equipment; token: string; onCommand: () => void }) {
  const [sending, setSending] = useState(false);

  const sendCmd = async (cmd: string) => {
    setSending(true);
    try {
      await fetch(`${API}/equipment/${eq.id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ command: cmd })
      });
      onCommand();
    } finally { setSending(false); }
  };

  const commandsForState: Record<string, string[]> = {
    Offline: ['CONNECT'], Idle: ['START', 'FAULT'],
    Starting: ['READY', 'FAULT'], Running: ['HOLD', 'STOP', 'FAULT'],
    Holding: ['RESUME', 'STOP'], Stopping: ['STOPPED'],
    Stopped: ['RESET'], Fault: ['CLEAR', 'MAINTAIN'], Maintenance: ['RESTORE']
  };
  const cmds = commandsForState[eq.state] || [];

  return (
    <div style={{
      background: '#0d1117', border: `1px solid ${stateColor[eq.state] || '#333'}`,
      borderRadius: 12, padding: 20, boxShadow: eq.state === 'Fault' ? `0 0 20px ${stateColor.Fault}44` : eq.state === 'Running' ? `0 0 10px ${stateColor.Running}22` : 'none',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ color: '#aaa', fontSize: 11, letterSpacing: 1 }}>EQUIPMENT</div>
          <div style={{ color: '#e0e0e0', fontSize: 18, fontWeight: 700 }}>{eq.id}</div>
        </div>
        <div style={{
          background: `${stateColor[eq.state] || '#333'}22`,
          color: stateColor[eq.state] || '#aaa',
          border: `1px solid ${stateColor[eq.state] || '#333'}`,
          borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600
        }}>
          {stateIcon[eq.state]} {eq.state}
        </div>
      </div>

      {eq.telemetry && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <StatCard label="TEMP" value={eq.telemetry.temperature} unit="°C" />
          <StatCard label="PRESSURE" value={eq.telemetry.pressure} unit="bar" />
          {eq.telemetry.rpm > 0 && <StatCard label="RPM" value={eq.telemetry.rpm} unit="rpm" />}
          {eq.telemetry.flowRate > 0 && <StatCard label="FLOW" value={eq.telemetry.flowRate} unit="L/min" />}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {cmds.map(cmd => (
          <button key={cmd} onClick={() => sendCmd(cmd)} disabled={sending} style={{
            background: cmd === 'FAULT' ? '#ff174422' : cmd === 'CLEAR' || cmd === 'READY' || cmd === 'CONNECT' ? '#00e67622' : '#ffffff11',
            color: cmd === 'FAULT' ? '#ff1744' : cmd === 'CLEAR' || cmd === 'READY' || cmd === 'CONNECT' ? '#00e676' : '#ccc',
            border: `1px solid ${cmd === 'FAULT' ? '#ff1744' : cmd === 'CLEAR' || cmd === 'READY' || cmd === 'CONNECT' ? '#00e676' : '#444'}`,
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: 0.5
          }}>{cmd}</button>
        ))}
      </div>

      {(eq.workOrders || 0) > 0 && (
        <div style={{ marginTop: 12, background: '#ff174411', border: '1px solid #ff174433', borderRadius: 6, padding: '6px 12px', color: '#ff5252', fontSize: 12 }}>
          ⚠️ {eq.workOrders} Open Work Order(s)
        </div>
      )}
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('admin');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true); setErr('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      if (!res.ok) { setErr('Invalid credentials'); return; }
      const data = await res.json();
      onLogin(data.token);
    } catch {
      setErr('Cannot connect to API Gateway. Is the server running?');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060910' }}>
      <div style={{ background: '#0d1117', border: '1px solid #1e3a5f', borderRadius: 16, padding: 48, width: 380, boxShadow: '0 0 60px #1e3a5f44' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#e0e0e0', letterSpacing: -1 }}>
            Plant<span style={{ color: '#40c4ff' }}>OS</span>
          </div>
          <div style={{ color: '#555', fontSize: 13, marginTop: 4 }}>Operator Terminal v1.0</div>
        </div>
        <input value={user} onChange={e => setUser(e.target.value)} placeholder="Username"
          style={{ width: '100%', padding: '12px 16px', background: '#161b22', border: '1px solid #30363d', borderRadius: 8, color: '#e0e0e0', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
        <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="Password"
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{ width: '100%', padding: '12px 16px', background: '#161b22', border: '1px solid #30363d', borderRadius: 8, color: '#e0e0e0', fontSize: 14, marginBottom: 20, boxSizing: 'border-box' }} />
        {err && <div style={{ color: '#ff5252', fontSize: 13, marginBottom: 12 }}>{err}</div>}
        <button onClick={login} disabled={loading} style={{
          width: '100%', padding: 14, background: '#40c4ff', color: '#000', border: 'none',
          borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer'
        }}>{loading ? 'Connecting...' : 'LOGIN'}</button>
        <div style={{ textAlign: 'center', color: '#555', fontSize: 12, marginTop: 16 }}>
          Default: admin / admin
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
function Dashboard({ token }: { token: string }) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'equipment' | 'cmms'>('equipment');
  const [simulating, setSimulating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [eqRes, woRes] = await Promise.all([
        fetch(`${API}/equipment`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/cmms/workorders`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const eqData = await eqRes.json();
      const woData = await woRes.json();
      setEquipment(eqData.equipment || []);
      setWorkOrders(woData.workOrders || []);
    } catch { }
  }, [token]);

  // WebSocket for real-time telemetry
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'TELEMETRY_UPDATE') {
          setEquipment(data.equipment);
          setLastUpdate(new Date(data.timestamp).toLocaleTimeString());
          if (data.workOrders !== undefined) fetchData();
        }
      } catch { }
    };
    return () => ws.close();
  }, [fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const simulate = async (mode: 'startup' | 'shutdown') => {
    setSimulating(true);
    try {
      await fetch(`${API}/simulate/${mode}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      setTimeout(fetchData, 500);
    } finally { setSimulating(false); }
  };

  const resolveWO = async (id: string) => {
    await fetch(`${API}/cmms/workorders/${id}/resolve`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    fetchData();
  };

  const runningCount = equipment.filter(e => e.state === 'Running').length;
  const faultCount = equipment.filter(e => e.state === 'Fault').length;
  const openWOs = workOrders.filter(w => w.status === 'OPEN').length;

  return (
    <div style={{ minHeight: '100vh', background: '#060910', fontFamily: "'Inter', -apple-system, sans-serif", color: '#e0e0e0' }}>
      {/* Header */}
      <header style={{ background: '#0d1117', borderBottom: '1px solid #1e3a5f', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Plant<span style={{ color: '#40c4ff' }}>OS</span> <span style={{ color: '#666', fontWeight: 400, fontSize: 13 }}>Operator Terminal</span></div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['equipment', 'cmms'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: activeTab === tab ? '#1e3a5f' : 'transparent', color: activeTab === tab ? '#40c4ff' : '#666',
                border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize'
              }}>{tab === 'cmms' ? `CMMS ${openWOs > 0 ? `(${openWOs})` : ''}` : 'Equipment'}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 12, color: connected ? '#00e676' : '#ff1744' }}>
            {connected ? '● LIVE' : '○ DISCONNECTED'}
          </div>
          {lastUpdate && <div style={{ fontSize: 11, color: '#444' }}>Updated {lastUpdate}</div>}
          <button onClick={() => simulate('startup')} disabled={simulating} style={{ background: '#00e67622', color: '#00e676', border: '1px solid #00e676', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>▶ START ALL</button>
          <button onClick={() => simulate('shutdown')} disabled={simulating} style={{ background: '#ff174422', color: '#ff5252', border: '1px solid #ff1744', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>■ STOP ALL</button>
        </div>
      </header>

      {/* KPI Bar */}
      <div style={{ background: '#0a0f16', borderBottom: '1px solid #111', padding: '12px 24px', display: 'flex', gap: 32 }}>
        <div><span style={{ color: '#555', fontSize: 11 }}>RUNNING </span><span style={{ color: '#00e676', fontSize: 20, fontWeight: 700 }}>{runningCount}</span><span style={{ color: '#555', fontSize: 11 }}> / {equipment.length}</span></div>
        <div><span style={{ color: '#555', fontSize: 11 }}>FAULTS </span><span style={{ color: faultCount > 0 ? '#ff1744' : '#555', fontSize: 20, fontWeight: 700 }}>{faultCount}</span></div>
        <div><span style={{ color: '#555', fontSize: 11 }}>WORK ORDERS </span><span style={{ color: openWOs > 0 ? '#ffc400' : '#555', fontSize: 20, fontWeight: 700 }}>{openWOs}</span></div>
        <div><span style={{ color: '#555', fontSize: 11 }}>PLANT STATUS </span><span style={{ color: faultCount > 0 ? '#ff1744' : runningCount > 0 ? '#00e676' : '#ffc400', fontSize: 13, fontWeight: 700 }}>{faultCount > 0 ? '⚠ FAULT' : runningCount === equipment.length ? '✓ RUNNING' : runningCount > 0 ? '⚡ PARTIAL' : '○ IDLE'}</span></div>
      </div>

      {/* Content */}
      <main style={{ padding: 24 }}>
        {activeTab === 'equipment' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 16 }}>
            {equipment.map(eq => (
              <EquipmentCard key={eq.id} eq={eq} token={token} onCommand={fetchData} />
            ))}
          </div>
        )}

        {activeTab === 'cmms' && (
          <div>
            <div style={{ marginBottom: 16, color: '#888', fontSize: 14 }}>
              {openWOs === 0 ? '✅ No open work orders. Factory running normally.' : `⚠️ ${openWOs} open work order(s) require attention.`}
            </div>
            {workOrders.length === 0 && <div style={{ color: '#555', fontSize: 14 }}>No work orders created yet. Inject a fault to auto-generate one.</div>}
            {workOrders.map(wo => (
              <div key={wo.id} style={{
                background: '#0d1117', border: `1px solid ${wo.status === 'OPEN' ? '#ff174444' : '#333'}`,
                borderRadius: 10, padding: 20, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
              }}>
                <div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: '#666', fontSize: 11 }}>{wo.id}</span>
                    <span style={{ background: wo.priority === 'HIGH' ? '#ff174422' : '#ffc40022', color: wo.priority === 'HIGH' ? '#ff5252' : '#ffc400', border: `1px solid ${wo.priority === 'HIGH' ? '#ff1744' : '#ffc400'}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{wo.priority}</span>
                    <span style={{ background: wo.status === 'OPEN' ? '#ff174422' : '#00e67622', color: wo.status === 'OPEN' ? '#ff5252' : '#00e676', border: `1px solid ${wo.status === 'OPEN' ? '#ff1744' : '#00e676'}`, borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{wo.status}</span>
                  </div>
                  <div style={{ color: '#e0e0e0', marginBottom: 4 }}>{wo.description}</div>
                  <div style={{ color: '#555', fontSize: 12 }}>Equipment: <span style={{ color: '#40c4ff' }}>{wo.equipmentId}</span> · Created: {new Date(wo.createdAt).toLocaleString()}</div>
                </div>
                {wo.status === 'OPEN' && (
                  <button onClick={() => resolveWO(wo.id)} style={{ background: '#00e67622', color: '#00e676', border: '1px solid #00e676', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>✓ Resolve</button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState<string | null>(null);
  return token ? <Dashboard token={token} /> : <LoginPage onLogin={setToken} />;
}
