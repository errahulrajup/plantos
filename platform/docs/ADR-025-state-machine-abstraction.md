# ADR-025: State Machine Provider Abstraction

## Status: ACCEPTED

## Context
PlantOS 0.3 introduces the Runtime Engine, which is responsible for metadata-driven execution. To achieve this, it dynamically generates state machines for Equipment, Workflows, and Batches based on ISA-88 standards. 
Using a robust third-party library like `XState` is highly beneficial for rapid, bug-free state transitions. However, heavily coupling the entire execution kernel directly to `XState` creates a severe vendor lock-in and risks the 10+ year longevity required of industrial systems.

## Decision
The PlantOS Runtime will never depend directly on any specific state machine implementation.
Instead, it will depend exclusively on the `IStateMachineProvider` interface.

### The Abstraction Layer
```typescript
interface IStateMachineProvider {
  createMachine(definition: MachineDefinition): IStateMachine;
  transition(currentState: string, event: StateEvent): string;
}
```

### The Adapter
We will implement an `XStateAdapter` that implements `IStateMachineProvider` behind the scenes.
The Runtime Kernel will inject this provider at boot.

## Consequences
- **Positive**: Complete independence from third-party workflow libraries. If `XState` becomes obsolete, or if we decide to build a custom PLC-native execution engine in the future, we only need to swap the Adapter. The Runtime logic remains untouched.
- **Negative**: Slight overhead in mapping generic MachineDefinitions into the specific XState JSON format, and mapping XState responses back to PlantOS domain events.

## Alternatives Considered
- **Directly using XState**: Rejected due to high risk of vendor lock-in for a core execution path.
- **Building a custom state engine from scratch for 0.3**: Rejected. XState provides mathematically sound state transitions out-of-the-box which accelerates the Alpha timeline without compromising the architecture, thanks to the Adapter pattern.
