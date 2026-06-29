import { IEquipmentRepository, EquipmentDTO } from '../contracts';
import { UUID, AssetState } from '../types';

/**
 * Note: In a real implementation, 'db' would be a configured instance of a Postgres Pool (e.g. from 'pg' or a query builder like 'knex').
 */
export class PostgreSQLEquipmentRepository implements IEquipmentRepository {
  constructor(private readonly db: any) {}

  async findById(id: UUID): Promise<EquipmentDTO | null> {
    const query = `SELECT * FROM plantos_equipment WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapToDTO(result.rows[0]);
  }

  async findAll(): Promise<EquipmentDTO[]> {
    const query = `SELECT * FROM plantos_equipment`;
    const result = await this.db.query(query);
    return result.rows.map(this.mapToDTO);
  }

  async save(entity: EquipmentDTO): Promise<void> {
    const query = `
      INSERT INTO plantos_equipment (id, tag, business_code, name, type, state, capabilities, properties, created_at, updated_at, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        tag = EXCLUDED.tag,
        business_code = EXCLUDED.business_code,
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        state = EXCLUDED.state,
        capabilities = EXCLUDED.capabilities,
        properties = EXCLUDED.properties,
        updated_at = EXCLUDED.updated_at,
        version = EXCLUDED.version;
    `;
    
    await this.db.query(query, [
      entity.id,
      entity.tag,
      entity.businessCode || null,
      entity.name,
      entity.type,
      entity.state,
      JSON.stringify(entity.capabilities),
      JSON.stringify(entity.properties),
      entity.createdAt,
      entity.updatedAt,
      entity.version
    ]);
  }

  async delete(id: UUID): Promise<void> {
    const query = `DELETE FROM plantos_equipment WHERE id = $1`;
    await this.db.query(query, [id]);
  }

  async findByTag(tag: string): Promise<EquipmentDTO | null> {
    const query = `SELECT * FROM plantos_equipment WHERE tag = $1 LIMIT 1`;
    const result = await this.db.query(query, [tag]);
    if (result.rows.length === 0) return null;
    return this.mapToDTO(result.rows[0]);
  }

  async findByCapability(capability: string): Promise<EquipmentDTO[]> {
    // Postgres JSONB array containment operator
    const query = `SELECT * FROM plantos_equipment WHERE capabilities @> $1::jsonb`;
    const result = await this.db.query(query, [JSON.stringify([capability])]);
    return result.rows.map(this.mapToDTO);
  }

  private mapToDTO(row: any): EquipmentDTO {
    return {
      id: row.id,
      tag: row.tag,
      businessCode: row.business_code,
      name: row.name,
      type: row.type,
      state: row.state as AssetState,
      capabilities: typeof row.capabilities === 'string' ? JSON.parse(row.capabilities) : row.capabilities,
      properties: typeof row.properties === 'string' ? JSON.parse(row.properties) : row.properties,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version
    };
  }
}
