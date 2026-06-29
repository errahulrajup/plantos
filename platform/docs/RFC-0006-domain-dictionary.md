# RFC-0006: Domain Dictionary

## Status: ACCEPTED

## Purpose
Establishes the authoritative glossary of manufacturing and system terminology for PlantOS. This ensures that the Platform Layer, Infrastructure Layer, and Business Layer all share the same ubiquitous language.

## Dictionary

### Equipment
**Definition**: A physical asset that performs work.
- Examples: Tank, Pump, Mixer, Heater, Valve.
- Hierarchy: Enterprise -> Site -> Area -> ProcessCell -> Unit -> EquipmentModule -> ControlModule.

### Capability
**Definition**: A reusable functional behaviour provided by Equipment.
- Examples: `CanHeat`, `CanMix`, `CanPump`, `CanMeasureTemperature`.
- Used by the Resource Allocation engine to resolve abstract operation requirements into concrete physical equipment.

### Operation
**Definition**: An atomic manufacturing activity.
- Examples: Heat to 80°C, Agitate for 10 minutes, Transfer 500L.

### Operation Step
**Definition**: A single executable step within an operation, often requiring operator interaction or system verification.

### Production Run
**Definition**: One continuous execution of a manufacturing order across a set of equipment.

### Batch
**Definition**: A traceable manufacturing lot of a specific product. Represents the execution of a Recipe.

### Material Lot
**Definition**: A supplier-traceable quantum of inventory. Must track origin, expiration, and quality status.

### Genealogy
**Definition**: The definitive relationship between input materials (consumed lots) and output materials (produced lots). Critical for food safety and recall compliance.

### Resource
**Definition**: A generic term encompassing Equipment, Persons, Tools, or Utilities required to execute a Capability.
