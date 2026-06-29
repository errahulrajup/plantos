# RFC-0011: Naming Convention

## Status: ACCEPTED

## Purpose
Ensures absolute consistency across the PlantOS ecosystem, making the code predictable for any enterprise developer.

## Conventions

### 1. Asset Tags
- **Format**: `[AREA]-[TYPE]-[NUMBER]`
- **Casing**: UPPERCASE with Hyphens.
- **Example**: `MIX-TK-001`

### 2. Commands & Events (CQRS)
- **Commands**: PascalCase, Imperative verb, ends with `Command`.
  - Example: `AllocateResourcesCommand`
- **Events**: PascalCase, Past tense verb, ends with `Event`.
  - Example: `ResourcesAllocatedEvent`

### 3. DTOs
- **Format**: PascalCase, ends with `DTO`.
  - Example: `RecipeDTO`, `BatchDTO`.

### 4. Repositories
- **Format**: Interfaces start with `I`, end with `Repository`. Implementations end with `Repository`.
  - Example: `IEquipmentRepository`, `PostgresEquipmentRepository`.

### 5. Packages
- **Format**: Kebab-case.
  - Example: `plantsmor-margarine-package`

### 6. Capabilities
- **Format**: PascalCase, starts with `Can`.
  - Example: `CanMix`, `CanHeat`, `CanPump`.

### 7. Plugins & Namespaces
- **Format**: `@plantos/[type]-[name]` for official plugins, `@vendor/[name]` for third-party.
  - Example: `@plantos/plugin-opcua`, `@siemens/s7-driver`.
