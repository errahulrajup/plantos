import { IAssetSDK, CreateEquipmentCommand, EquipmentDTO, IEquipmentRepository } from '../contracts';
import { UUID, AssetState, LogLayer } from '../types';
import { IdentityService, Logger, EventDispatcher } from '../index';

export class AssetSDK implements IAssetSDK {
  constructor(
    private readonly repository: IEquipmentRepository,
    private readonly identity: IdentityService,
    private readonly logger: Logger,
    private readonly events: EventDispatcher
  ) {}

  public async registerEquipment(cmd: CreateEquipmentCommand): Promise<UUID> {
    this.logger.info(LogLayer.APP, 'AssetSDK', `Registering equipment: ${cmd.payload.tag}`);
    
    // Check if equipment with tag already exists
    const existing = await this.repository.findByTag(cmd.payload.tag);
    if (existing) {
      throw new Error(`Equipment with tag ${cmd.payload.tag} already exists.`);
    }

    const newId = this.identity.generateUUID();
    
    const equipment: EquipmentDTO = {
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      tag: cmd.payload.tag,
      name: cmd.payload.name,
      type: cmd.payload.type,
      state: AssetState.PLANNED,
      capabilities: cmd.payload.capabilities,
      properties: cmd.payload.properties
    };

    await this.repository.save(equipment);
    
    // Publish Event
    await this.events.publish({
      eventId: this.identity.generateUUID(),
      type: 'EquipmentStateChangedEvent',
      topic: 'ASSET/STATE_CHANGE',
      timestamp: new Date(),
      payload: {
        equipmentId: newId,
        oldState: null,
        newState: AssetState.PLANNED
      }
    });

    return newId;
  }

  public async getEquipmentDetails(equipmentId: UUID): Promise<EquipmentDTO> {
    const equipment = await this.repository.findById(equipmentId);
    if (!equipment) {
      throw new Error(`Equipment with ID ${equipmentId} not found.`);
    }
    return equipment;
  }

  public async findCapabilities(capabilities: string[]): Promise<EquipmentDTO[]> {
    if (capabilities.length === 0) return [];
    
    // In a real implementation this might do a more complex intersection query
    // For now, we will query the repository for the first capability and filter in memory
    const candidates = await this.repository.findByCapability(capabilities[0]);
    
    return candidates.filter(equip => 
      capabilities.every(cap => equip.capabilities.includes(cap))
    );
  }
}
