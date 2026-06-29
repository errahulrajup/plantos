import { IProductionOrderRepository, ProductionOrderDTO } from '../../src/contracts';
import { UUID, OrderStatus } from '../../src/types';

export class MockProductionOrderRepository implements IProductionOrderRepository {
  private data: Map<UUID, ProductionOrderDTO> = new Map();

  async findById(id: UUID): Promise<ProductionOrderDTO | null> {
    return this.data.get(id) || null;
  }

  async findAll(): Promise<ProductionOrderDTO[]> {
    return Array.from(this.data.values());
  }

  async save(entity: ProductionOrderDTO): Promise<void> {
    this.data.set(entity.id, entity);
  }

  async delete(id: UUID): Promise<void> {
    this.data.delete(id);
  }

  async findByStatus(status: OrderStatus): Promise<ProductionOrderDTO[]> {
    const results: ProductionOrderDTO[] = [];
    for (const order of this.data.values()) {
      if (order.status === status) {
        results.push(order);
      }
    }
    return results;
  }

  async findByOrderNumber(orderNumber: string): Promise<ProductionOrderDTO | null> {
    for (const order of this.data.values()) {
      if (order.orderNumber === orderNumber) {
        return order;
      }
    }
    return null;
  }
}
