export interface CapabilityDefinition {
  id: string;
  name: string;
  description: string;
  parameters: string[]; // Parameters this capability expects
}

export class CapabilityRegistry {
  private capabilities: Map<string, CapabilityDefinition> = new Map();

  /**
   * Register a new Capability in the PlantOS ecosystem
   */
  public registerCapability(cap: CapabilityDefinition): void {
    if (this.capabilities.has(cap.id)) {
      throw new Error(`Capability ${cap.id} is already registered.`);
    }
    this.capabilities.set(cap.id, cap);
  }

  /**
   * Get capability details
   */
  public getCapability(id: string): CapabilityDefinition | undefined {
    return this.capabilities.get(id);
  }

  /**
   * List all registered capabilities
   */
  public getAllCapabilities(): CapabilityDefinition[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Check if a set of capabilities exist in the registry
   */
  public validateCapabilitiesExist(ids: string[]): boolean {
    return ids.every(id => this.capabilities.has(id));
  }
}
