# Plant Certification Levels

To ensure marketplace quality and safety, all third-party Plant Packages and Plugins are evaluated against strict certification levels.

## 1. Community
- **Definition**: Uploaded by independent developers.
- **Trust Level**: Low. Use at own risk.
- **Requirement**: Passes basic compilation checks.
- **Example**: `@community/demo-plant`.

## 2. Verified
- **Definition**: Manually reviewed by the PlantOS governance team for malicious code.
- **Trust Level**: Medium. Safe for test environments.
- **Requirement**: No direct DB access, follows naming conventions (RFC-0011).

## 3. Certified
- **Definition**: Fully tested and endorsed by PlantOS. Guaranteed backward compatibility.
- **Trust Level**: High. Ready for pilot production.
- **Requirement**: 100% Test Coverage, Documentation Complete, Passes Architecture Fitness.

## 4. Production Ready
- **Definition**: Battle-tested in actual physical plants under load.
- **Trust Level**: Absolute.
- **Example**: `@plantos/plantsmor-reference`.
