# RFC-0009: Extension Model

## Status: ACCEPTED

## Purpose
Defines how PlantOS can be extended by third-party packages (e.g., custom equipment drivers, specialized quality algorithms) without modifying the core monolithic platform.

## Plugin Architecture

### Extension Points
The Platform SDK exposes specific interfaces that plugins can implement:
1. `IEquipmentDriver`: Custom logic for integrating proprietary PLCs.
2. `IAllocationStrategy`: Custom logic for the Resource Engine (e.g., shortest-path vs greed-based).
3. `IUIWidget`: Custom React components injected into `plantos-studio` or `plantos-operator`.

### Plugin Lifecycle
Every plugin must implement `IPlantOSPlugin`, providing methods for the following lifecycle hooks:

```text
Install   (Files copied, dependencies checked)
  ↓
Validate  (Signatures verified, schema compliance checked)
  ↓
Activate  (Loaded into memory, DI container registered)
  ↓
Suspend   (Temporarily disabled, memory retained)
  ↓
Remove    (Unregistered, artifacts deleted)
```

## Sandboxing
Plugins execute within the same process (Modular Monolith) but are strictly bounded by interface contracts. A plugin cannot directly access the Database layer; it must route all requests through the CQRS `CommandBus` or `QueryBus`.
