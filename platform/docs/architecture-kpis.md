# Architecture KPIs

Architecture is only as good as what can be measured. The following KPIs must be monitored continuously across releases.

## 1. Performance
- **Boot Time**: Time from process start to Kernel ready.
- **Compile Time**: Time to compile an entire Plant Package.
- **Render FPS**: Framerate of Studio canvas under load (10k items).
- **Memory**: Base memory footprint in Megabytes (MB).

## 2. Reliability
- **Crash Rate**: Unhandled exceptions per 1M operations.
- **Architecture Violations**: Number of failing Fitness Rules (Must be 0).
- **Failed Commands**: Percentage of CQRS commands rejected.
- **Event Queue Backlog**: Maximum length of unhandled events.

## 3. Quality
- **Test Coverage**: Percentage of lines covered by Jest (Target: ≥80%).
- **Documentation Coverage**: Number of public APIs with TSDoc.
- **ADR Coverage**: Percentage of design decisions formally documented.
- **RFC Coverage**: Percentage of architectural rules formally documented.

## 4. Platform Scale
- **Supported Tags**: Total live equipment tags the Historian can track.
- **Supported Assets**: Max nodes on the layout canvas.
- **Package Size**: Compiled bundle size of `.plantos` files.
- **Compile Success Rate**: Percentage of valid user configurations that successfully compile.
