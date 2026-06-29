# RFC-0008: Error Model

## Status: ACCEPTED

## Purpose
Standardizes error handling across the PlantOS ecosystem to ensure predictable failure modes, graceful recovery, and clear operator notifications.

## Error Categories & Codes

### 1. Business Error (Prefix: `BUS-`)
Violations of manufacturing rules or domain logic.
- `BUS-1001`: Resource Not Available.
- `BUS-1002`: Recipe Sequence Violation (e.g., trying to skip a mandatory step).
- `BUS-1003`: Material Lot Expired.

### 2. Validation Error (Prefix: `VAL-`)
Malformed data or schema violations, typically caught by the Kernel/Compiler.
- `VAL-2001`: Invalid DTO Payload.
- `VAL-2002`: Missing Required Property.

### 3. Safety Error (Prefix: `SAF-`)
Critical interlock or safety violations. Must trigger immediate system halt or alarm.
- `SAF-3001`: Equipment Interlock Active (e.g., Valve open while Agitator running).
- `SAF-3002`: Operator Authorization Failed (missing required certification).

### 4. Communication Error (Prefix: `COM-`)
Failures communicating with edge devices, PLCs, or OPC-UA servers.
- `COM-4001`: Device Timeout.
- `COM-4002`: Telemetry Stream Disconnected.

### 5. Infrastructure Error (Prefix: `INF-`)
Core platform failures (Database, Message Queue).
- `INF-5001`: Database Connection Refused.
- `INF-5002`: Event Bus Publish Failed.

### 6. Security Error (Prefix: `SEC-`)
- `SEC-6001`: Unauthorized Action.
- `SEC-6002`: Invalid Token.

### 7. Configuration Error (Prefix: `CFG-`)
- `CFG-7001`: Invalid Environment Variable.
- `CFG-7002`: Package Manifest Corrupt.
