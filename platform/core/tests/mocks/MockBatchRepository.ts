import { IBatchRepository, BatchDTO } from '../../src/contracts';
import { UUID, BatchStatus } from '../../src/types';

export class MockBatchRepository implements IBatchRepository {
  private data: Map<UUID, BatchDTO> = new Map();

  async findById(id: UUID): Promise<BatchDTO | null> {
    return this.data.get(id) || null;
  }

  async findAll(): Promise<BatchDTO[]> {
    return Array.from(this.data.values());
  }

  async save(entity: BatchDTO): Promise<void> {
    this.data.set(entity.id, entity);
  }

  async delete(id: UUID): Promise<void> {
    this.data.delete(id);
  }

  async findByStatus(status: BatchStatus): Promise<BatchDTO[]> {
    const results: BatchDTO[] = [];
    for (const batch of this.data.values()) {
      if (batch.status === status) {
        results.push(batch);
      }
    }
    return results;
  }

  async findByRecipe(recipeId: UUID): Promise<BatchDTO[]> {
    const results: BatchDTO[] = [];
    for (const batch of this.data.values()) {
      if (batch.recipeId === recipeId) {
        results.push(batch);
      }
    }
    return results;
  }
}
