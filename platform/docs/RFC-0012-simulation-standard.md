# RFC-0012: Simulation Standard

## Status: ACCEPTED

## Purpose
Establishes the core rules for the PlantOS Digital Twin and Simulation Engine to ensure deterministic, reproducible validation of metadata packages.

## 1. Simulation Clock
- The simulation must run on a **Deterministic Clock**, completely decoupled from the system wall clock.
- `advance(ms)` allows the simulation to skip hours of batch time in milliseconds.

## 2. Sensor & Physics Model
- Simulated sensors must output values based on linear profiles or simple physics abstractions (e.g., if Pump is `RUNNING`, Tank Level increases by `x` units per tick).
- Randomization (noise) must be controlled via a seeded PRNG to ensure reproducibility.

## 3. Failure Model
- The simulation must support injecting **Hardware Faults**:
  - `STUCK_OPEN`: Valve refuses to close.
  - `STUCK_CLOSED`: Valve refuses to open.
  - `NO_COMM`: Sensor drops offline.
- The Runtime must throw an Interlock violation and transition the Equipment state to `Fault`.

## 4. Deterministic Replay
- Every simulation run will output an `Execution Report` containing the exact chronological event ledger.
- This ledger can be fed back into the engine to perfectly replay the scenario for debugging.
