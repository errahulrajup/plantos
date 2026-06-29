# RFC-0010: Performance Budget

## Status: ACCEPTED

## Purpose
Establishes the non-negotiable performance limits for PlantOS. Any pull request or capability addition that causes the system to exceed these bounds must be rejected.

## Budgets

### 1. Visual Layout Rendering (Studio)
- **Target**: 10,000 visual objects (nodes/edges) on canvas.
- **Budget**: < 16ms per frame (60 FPS during pan/zoom).

### 2. Telemetry Ingestion (Core)
- **Target**: 100,000 tags/sec across the plant.
- **Budget**: The `TelemetryService` must process and buffer these without blocking the Node.js event loop for more than 10ms at a time.

### 3. Command Latency (CQRS)
- **Target**: Any standard business command (e.g., `StartBatchCommand`).
- **Budget**: < 250ms end-to-end response time (including DB persistence and Event Bus publish).

### 4. Package Compilation
- **Target**: Compiling a full enterprise Plant Package (PlantSmör).
- **Budget**: < 30 seconds.

### 5. Memory Footprint
- **Target**: `plantos-platform` node process (excluding DB).
- **Budget**: < 2 GB RSS under peak load.
