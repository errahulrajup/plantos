import { IEquipmentRepository, EquipmentDTO } from '../../src/contracts';
import { UUID } from '../../src/types';

export class MockEquipmentRepository implements IEquipmentRepository {
  private data: Map<UUID, EquipmentDTO> = new Map();

  async findById(id: UUID): Promise<EquipmentDTO | null> {
    return this.data.get(id) || null;
  }

  async findAll(): Promise<EquipmentDTO[]> {
    return Array.from(this.data.values());
  }

  async save(entity: EquipmentDTO): Promise<void> {
    this.data.set(entity.id, entity);
  }

  async delete(id: UUID): Promise<void> {
    this.data.delete(id);
  }

  async findByTag(tag: string): Promise<EquipmentDTO | null> {
    for (const equip of this.data.values()) {
      if (equip.tag === tag) return equip;
    }
    return null;
  }

  async findByCapability(capability: string): Promise<EquipmentDTO[]> {
    const results: EquipmentDTO[] = [];
    for (const equip of this.data.values()) {
      if (equip.capabilities.includes(capability)) {
        results.push(equip);
      }
    }
    return results;
  }
}
