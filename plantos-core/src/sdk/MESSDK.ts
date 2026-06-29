import { IMESBaseSDK, StartBatchCommand, CreateProductionOrderCommand, BatchDTO, IBatchRepository, IProductionOrderRepository } from '../contracts';
import { UUID, BatchStatus, OrderStatus, LogLayer } from '../types';
import { IdentityService, Logger, EventDispatcher } from '../index';

export class MESSDK implements IMESBaseSDK {
  constructor(
    private readonly batchRepo: IBatchRepository,
    private readonly orderRepo: IProductionOrderRepository,
    private readonly identity: IdentityService,
    private readonly logger: Logger,
    private readonly events: EventDispatcher
  ) {}

  public async createProductionOrder(cmd: CreateProductionOrderCommand): Promise<UUID> {
    this.logger.info(LogLayer.APP, 'MESSDK', `Creating Production Order: ${cmd.payload.orderNumber}`);

    const existing = await this.orderRepo.findByOrderNumber(cmd.payload.orderNumber);
    if (existing) {
      throw new Error(`Order ${cmd.payload.orderNumber} already exists.`);
    }

    const orderId = this.identity.generateUUID();
    
    await this.orderRepo.save({
      id: orderId,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      orderNumber: cmd.payload.orderNumber,
      recipeId: cmd.payload.recipeId,
      status: OrderStatus.CREATED,
      targetQuantity: cmd.payload.targetQuantity,
      completedQuantity: 0,
      unit: cmd.payload.unit
    });

    // We don't automatically generate batches yet, that would happen in a downstream Planning Engine
    // But we emit an event
    await this.events.publish({
      eventId: this.identity.generateUUID(),
      type: 'ProductionOrderCreatedEvent',
      topic: 'MES/ORDER_CREATED',
      timestamp: new Date(),
      payload: {
        orderId,
        orderNumber: cmd.payload.orderNumber
      }
    });

    return orderId;
  }

  public async startBatch(cmd: StartBatchCommand): Promise<void> {
    this.logger.info(LogLayer.APP, 'MESSDK', `Starting batch: ${cmd.payload.batchId}`);
    
    const batch = await this.batchRepo.findById(cmd.payload.batchId);
    if (!batch) {
      throw new Error(`Batch with ID ${cmd.payload.batchId} not found.`);
    }

    if (batch.status !== BatchStatus.PLANNED && batch.status !== BatchStatus.HOLD) {
      throw new Error(`Batch cannot be started from current status: ${batch.status}`);
    }

    batch.status = BatchStatus.RUNNING;
    batch.updatedAt = new Date();
    batch.version += 1;

    await this.batchRepo.save(batch);

    await this.events.publish({
      eventId: this.identity.generateUUID(),
      type: 'BatchStartedEvent',
      topic: 'MES/BATCH_START',
      timestamp: new Date(),
      payload: {
        batchId: batch.id,
        recipeId: batch.recipeId,
        operatorId: cmd.payload.operatorId,
        startTime: new Date()
      }
    });
  }

  public async getBatchDetails(batchId: UUID): Promise<BatchDTO> {
    const batch = await this.batchRepo.findById(batchId);
    if (!batch) {
      throw new Error(`Batch with ID ${batchId} not found.`);
    }
    return batch;
  }

  public async holdBatch(batchId: UUID, reason: string): Promise<void> {
    this.logger.info(LogLayer.APP, 'MESSDK', `Holding batch: ${batchId} Reason: ${reason}`);
    
    const batch = await this.batchRepo.findById(batchId);
    if (!batch) {
      throw new Error(`Batch with ID ${batchId} not found.`);
    }

    if (batch.status !== BatchStatus.RUNNING) {
      throw new Error(`Only RUNNING batches can be placed on HOLD. Current: ${batch.status}`);
    }

    batch.status = BatchStatus.HOLD;
    batch.updatedAt = new Date();
    batch.version += 1;

    await this.batchRepo.save(batch);

    // Normally publish a BatchSuspendedEvent here
  }
}
