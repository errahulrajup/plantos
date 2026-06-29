import { UUID, LogLayer } from '../types';
import { RecipeDTO, EquipmentDTO } from '../contracts/dtos';
import { IAssetSDK } from '../contracts/sdk';
import { Logger } from '../logging/Logger';

export class ResourceEngine {
  constructor(
    private readonly assetSDK: IAssetSDK,
    private readonly logger: Logger
  ) {}

  /**
   * Allocates equipment for a given recipe by matching required capabilities.
   * In a full implementation, this would also check equipment status (e.g. not already in use).
   */
  public async allocateForRecipe(recipe: RecipeDTO): Promise<Map<UUID, EquipmentDTO>> {
    this.logger.info(LogLayer.APP, 'ResourceEngine', `Allocating resources for Recipe: ${recipe.name}`);
    
    const allocations = new Map<UUID, EquipmentDTO>();

    for (const operation of recipe.operations) {
      if (!operation.requiredCapabilities || operation.requiredCapabilities.length === 0) {
        continue; // No specific equipment needed
      }

      this.logger.debug(LogLayer.APP, 'ResourceEngine', `Searching equipment for operation ${operation.name} requiring: ${operation.requiredCapabilities.join(', ')}`);
      
      const candidates = await this.assetSDK.findCapabilities(operation.requiredCapabilities);
      
      if (candidates.length === 0) {
        throw new Error(`Allocation Failed: No equipment found satisfying capabilities [${operation.requiredCapabilities.join(', ')}] for operation ${operation.name}`);
      }

      // Simple allocation strategy: pick the first available candidate
      // Advanced routing engine would pick based on physical connections, maintenance schedules, etc.
      const selected = candidates[0];
      allocations.set(operation.id, selected);
      
      this.logger.info(LogLayer.APP, 'ResourceEngine', `Allocated ${selected.tag} for operation ${operation.name}`);
    }

    return allocations;
  }
}
