# ADR-026: Simulation-Driven Validation

## Status: ACCEPTED

## Context
Deploying unverified metadata to a live physical factory poses immense safety, quality, and financial risks. 
Since PlantOS relies heavily on metadata to dynamically construct execution paths, we must ensure that the logical constraints, interlocks, and state transitions described in a `.plantos` package behave exactly as intended before they ever reach the edge servers.

## Decision
Every PlantOS package must pass through a mandatory **Simulation Validation Suite** before it can be deployed to production. 

1. **Digital Twin**: The Validation Suite will boot a deterministic Digital Twin of the `platform/runtime`.
2. **Fault Injection**: The simulation must evaluate not only normal 'sunny-day' production orders but explicitly test 'rainy-day' profiles such as:
   - Equipment Faults (Pump Failures, Valve Stuck).
   - Sensor Drift (Temperature too high, Flow too slow).
   - Infrastructure Loss (Power restarts, network timeouts).
3. **Acceptance**: A package is marked as `PRODUCTION_READY` if and only if the Runtime recovers gracefully from these scenarios without violating safety interlocks or corrupting batch genealogies.

## Consequences
- **Positive**: Massively accelerates commissioning times. Integrators can prove a factory layout works 100% in the cloud before stepping foot on the physical site. 
- **Negative**: Metadata authors must now also write Simulation Profiles for their equipment.
