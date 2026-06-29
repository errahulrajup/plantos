import { UUID, LogLayer, ExecutionContext } from '../types';
import { RecipeDTO, OperationDTO } from '../contracts/dtos';
import { Logger } from '../logging/Logger';
import { EventDispatcher } from '../cqrs/EventDispatcher';

export interface StepExecutionState {
  operationId: UUID;
  status: 'PENDING' | 'ACTIVE' | 'WAITING_FOR_OPERATOR' | 'COMPLETED' | 'ABORTED';
  startedAt?: Date;
  completedAt?: Date;
  collectedData: Record<string, any>;
}

export interface BatchExecutionState {
  batchId: UUID;
  recipeId: UUID;
  currentSequence: number;
  steps: Map<UUID, StepExecutionState>;
  recipeSnapshot: RecipeDTO; // In a real system, recipes must be immutable snapshots
}

export class WorkflowEngine {
  private activeExecutions = new Map<UUID, BatchExecutionState>();

  constructor(
    private readonly logger: Logger,
    private readonly events: EventDispatcher
  ) {}

  public initializeBatchExecution(batchId: UUID, recipe: RecipeDTO): void {
    const state: BatchExecutionState = {
      batchId,
      recipeId: recipe.id,
      currentSequence: 1, // 1-indexed
      steps: new Map(),
      recipeSnapshot: recipe
    };

    for (const op of recipe.operations) {
      state.steps.set(op.id, {
        operationId: op.id,
        status: 'PENDING',
        collectedData: {}
      });
    }

    this.activeExecutions.set(batchId, state);
    this.logger.info(LogLayer.APP, 'WorkflowEngine', `Initialized workflow for Batch ${batchId} with ${recipe.operations.length} operations.`);
  }

  public async advanceBatch(batchId: UUID, inputData: Record<string, any>, context: ExecutionContext): Promise<void> {
    const execution = this.activeExecutions.get(batchId);
    if (!execution) {
      throw new Error(`Workflow execution not found for batch ${batchId}`);
    }

    // Find current operation based on sequence
    const currentOp = execution.recipeSnapshot.operations.find(o => o.sequence === execution.currentSequence);
    if (!currentOp) {
      this.logger.info(LogLayer.APP, 'WorkflowEngine', `Batch ${batchId} has completed all steps.`);
      return;
    }

    const stepState = execution.steps.get(currentOp.id)!;

    if (stepState.status === 'PENDING') {
      // Start the step
      stepState.status = 'ACTIVE';
      stepState.startedAt = new Date();
      this.logger.info(LogLayer.APP, 'WorkflowEngine', `Batch ${batchId} started step ${currentOp.name}`);
      
      // If it requires manual input, transition to waiting
      if (Object.keys(currentOp.parameters || {}).length > 0) {
        stepState.status = 'WAITING_FOR_OPERATOR';
        await this.events.publish({
          eventId: crypto.randomUUID(),
          type: 'StepRequiresInputEvent',
          topic: 'MES/STEP_INPUT',
          timestamp: new Date(),
          payload: { batchId, operationId: currentOp.id, requestedParams: currentOp.parameters }
        });
        return; // Pause execution until operator inputs data
      }
    }

    if (stepState.status === 'WAITING_FOR_OPERATOR') {
      // Operator provided data
      stepState.collectedData = { ...stepState.collectedData, ...inputData };
      this.logger.info(LogLayer.APP, 'WorkflowEngine', `Batch ${batchId} received operator data for ${currentOp.name}`);
    }

    // Mark complete and move to next
    stepState.status = 'COMPLETED';
    stepState.completedAt = new Date();
    execution.currentSequence += 1;

    await this.events.publish({
      eventId: crypto.randomUUID(),
      type: 'StepCompletedEvent',
      topic: 'MES/STEP_COMPLETED',
      timestamp: new Date(),
      payload: { batchId, operationId: currentOp.id, collectedData: stepState.collectedData }
    });

    this.logger.info(LogLayer.APP, 'WorkflowEngine', `Batch ${batchId} completed step ${currentOp.name}. Moving to sequence ${execution.currentSequence}`);
  }

  public getCurrentStep(batchId: UUID): OperationDTO | null {
    const execution = this.activeExecutions.get(batchId);
    if (!execution) return null;

    return execution.recipeSnapshot.operations.find(o => o.sequence === execution.currentSequence) || null;
  }
}
