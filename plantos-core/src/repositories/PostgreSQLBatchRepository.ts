import { IBatchRepository, BatchDTO } from '../contracts';
import { UUID, BatchStatus } from '../types';

export class PostgreSQLBatchRepository implements IBatchRepository {
  constructor(private readonly db: any) {}

  async findById(id: UUID): Promise<BatchDTO | null> {
    const query = `SELECT * FROM plantos_batches WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapToDTO(result.rows[0]);
  }

  async findAll(): Promise<BatchDTO[]> {
    const query = `SELECT * FROM plantos_batches`;
    const result = await this.db.query(query);
    return result.rows.map(this.mapToDTO);
  }

  async save(entity: BatchDTO): Promise<void> {
    const query = `
      INSERT INTO plantos_batches (id, batch_number, recipe_id, status, planned_quantity, actual_quantity, unit, created_at, updated_at, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        actual_quantity = EXCLUDED.actual_quantity,
        updated_at = EXCLUDED.updated_at,
        version = EXCLUDED.version;
    `;
    
    await this.db.query(query, [
      entity.id,
      entity.batchNumber,
      entity.recipeId,
      entity.status,
      entity.plannedQuantity,
      entity.actualQuantity,
      entity.unit,
      entity.createdAt,
      entity.updatedAt,
      entity.version
    ]);
  }

  async delete(id: UUID): Promise<void> {
    const query = `DELETE FROM plantos_batches WHERE id = $1`;
    await this.db.query(query, [id]);
  }

  async findByStatus(status: BatchStatus): Promise<BatchDTO[]> {
    const query = `SELECT * FROM plantos_batches WHERE status = $1`;
    const result = await this.db.query(query, [status]);
    return result.rows.map(this.mapToDTO);
  }

  async findByRecipe(recipeId: UUID): Promise<BatchDTO[]> {
    const query = `SELECT * FROM plantos_batches WHERE recipe_id = $1`;
    const result = await this.db.query(query, [recipeId]);
    return result.rows.map(this.mapToDTO);
  }

  private mapToDTO(row: any): BatchDTO {
    return {
      id: row.id,
      batchNumber: row.batch_number,
      recipeId: row.recipe_id,
      status: row.status as BatchStatus,
      plannedQuantity: row.planned_quantity,
      actualQuantity: row.actual_quantity,
      unit: row.unit,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version
    };
  }
}
