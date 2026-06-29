import * from 'crypto';
import { Logger } from '../logging/Logger';
import { SchemaEngine } from '../metadata/SchemaEngine';
import { CapabilityRegistry } from '../metadata/CapabilityRegistry';
import { LogLayer } from '../types';

export interface RawStudioConfiguration {
  version: string;
  author: string;
  name: string;
  dependencies: Record<string, string>;
  assets: any[]; // Raw equipment and layout data
  recipes: any[];
}

export interface CompiledPlantPackage {
  manifest: {
    uuid: string;
    name: string;
    version: string;
    author: string;
  };
  signature: string;
  dependencies: Record<string, string>;
  payload: {
    assets: any[];
    recipes: any[];
  };
  compiledAt: Date;
}

export class ConfigurationCompiler {
  constructor(
    private readonly logger: Logger,
    private readonly schemaEngine: SchemaEngine,
    private readonly capabilityRegistry: CapabilityRegistry
  ) {}

  /**
   * Generates a deterministic SHA-256 signature for the package payload
   */
  private generateSignature(payloadStr: string): string {
    // We dynamically require crypto to avoid breaking if not in Node env
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(payloadStr).digest('hex');
  }

  /**
   * Takes a raw configuration from PlantOS Studio, validates it, and compiles it into a signed package.
   */
  public compile(rawConfig: RawStudioConfiguration): CompiledPlantPackage {
    this.logger.info(LogLayer.SYSTEM, 'Compiler', `Starting compilation for package: ${rawConfig.name} v${rawConfig.version}`);

    // Step 1: Validate Dependencies (Ensure kernel version matches etc)
    if (!rawConfig.dependencies['plantos.kernel']) {
      throw new Error('Compilation Failed: Missing required dependency "plantos.kernel"');
    }

    // Step 2: Validate Schemas & Capabilities
    // Example validation loop for assets
    for (const asset of rawConfig.assets) {
      if (!asset.capabilities) continue;
      if (!this.capabilityRegistry.validateCapabilitiesExist(asset.capabilities)) {
         throw new Error(`Compilation Failed: Asset ${asset.tag} contains unregistered capabilities.`);
      }
      // Schema validation logic would also be enforced here
    }

    // Step 3: Prune Unused assets, resolve links (Simulation logic)
    const prunedAssets = rawConfig.assets; // In a real compiler, we strip dead code here
    
    // Step 4: Serialize and Sign
    const payloadStr = JSON.stringify({ assets: prunedAssets, recipes: rawConfig.recipes });
    const signature = this.generateSignature(payloadStr);

    const compiledPackage: CompiledPlantPackage = {
      manifest: {
        uuid: 'PKG-' + Math.random().toString(36).substring(2, 9), // Stub UUID
        name: rawConfig.name,
        version: rawConfig.version,
        author: rawConfig.author
      },
      signature,
      dependencies: rawConfig.dependencies,
      payload: {
        assets: prunedAssets,
        recipes: rawConfig.recipes
      },
      compiledAt: new Date()
    };

    this.logger.info(LogLayer.SYSTEM, 'Compiler', `Compilation successful. Signature: ${signature}`);
    return compiledPackage;
  }
}
