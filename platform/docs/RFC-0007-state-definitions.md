# RFC-0007: State Definitions

## Status: ACCEPTED

## Purpose
Defines the standard, globally recognized state machines for core PlantOS entities. Custom states may be added via Extensions, but core states must strictly adhere to this model.

## 1. Batch Execution State
Follows ISA-88 standard batch control states:
```text
Draft        (Authoring/Validation)
  ↓
Planned      (Scheduled, awaiting resources)
  ↓
Allocated    (Equipment reserved)
  ↓
Running      (Active execution)
  ↓
Paused       (Temporarily halted, HOLD)
  ↓
Completed    (Execution finished)
  ↓
Released     (Quality approved)
  ↓
Archived     (Historical record)
```

## 2. Equipment Lifecycle State
```text
Planned      (Design phase)
  ↓
Installed    (Physically present, not tested)
  ↓
Commissioned (Tested, ready for IO check)
  ↓
Operational  (Available for production)
  ↓
Maintenance  (Out of service for repair/cleaning)
  ↓
Retired      (Decommissioned)
```

## 3. Alarm State
```text
Raised       (Condition active)
  ↓
Acknowledged (Operator has seen it, condition may still be active)
  ↓
Shelved      (Temporarily suppressed)
  ↓
Cleared      (Condition resolved)
```
