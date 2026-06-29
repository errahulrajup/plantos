export class Container {
  private services: Map<string, any> = new Map();

  /**
   * Register a service/engine interface to its implementation
   */
  public register<T>(interfaceName: string, implementation: T): void {
    if (this.services.has(interfaceName)) {
      throw new Error(`Service [${interfaceName}] is already registered in the Container.`);
    }
    this.services.set(interfaceName, implementation);
  }

  /**
   * Resolve a service by its interface name
   */
  public resolve<T>(interfaceName: string): T {
    const service = this.services.get(interfaceName);
    if (!service) {
      throw new Error(`Service [${interfaceName}] not found in the Container.`);
    }
    return service as T;
  }

  /**
   * Check if a service is registered
   */
  public has(interfaceName: string): boolean {
    return this.services.has(interfaceName);
  }
}
