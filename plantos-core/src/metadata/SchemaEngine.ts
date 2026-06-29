export interface SchemaDefinition {
  name: string;
  version: string;
  schema: Record<string, any>;
}

export class SchemaEngine {
  private schemas: Map<string, SchemaDefinition> = new Map();

  /**
   * Register a new JSON Schema definition for a dynamic entity
   */
  public registerSchema(definition: SchemaDefinition): void {
    const key = `${definition.name}@${definition.version}`;
    if (this.schemas.has(key)) {
      throw new Error(`Schema ${key} is already registered.`);
    }
    this.schemas.set(key, definition);
  }

  /**
   * Fetch a registered schema
   */
  public getSchema(name: string, version: string): SchemaDefinition | undefined {
    return this.schemas.get(`${name}@${version}`);
  }

  /**
   * Validate a payload against a registered schema
   */
  public validate(name: string, version: string, payload: Record<string, any>): boolean {
    const schemaDef = this.getSchema(name, version);
    if (!schemaDef) {
      throw new Error(`Cannot validate: Schema ${name}@${version} not found.`);
    }
    
    // In a real implementation, we would use AJV or another JSON Schema validator here.
    // For the core implementation, we simulate validation by checking required keys.
    const requiredKeys: string[] = schemaDef.schema.required || [];
    for (const key of requiredKeys) {
      if (!(key in payload)) {
        return false;
      }
    }
    return true;
  }
}
