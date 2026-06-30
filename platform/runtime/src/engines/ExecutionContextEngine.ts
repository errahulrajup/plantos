export interface ExecutionContext {
  batchId?: string;
  recipeId?: string;
  shift?: string;
  operatorId?: string;
  areaId?: string;
  equipmentId?: string;
  timestamp: string;
}

/**
 * Ensures that every command and event inside the Runtime 
 * carries strict context metadata for auditing and historian tracking.
 */
export class ExecutionContextEngine {
  private currentShift: string = 'SHIFT_A';

  public enrichContext(baseContext: Partial<ExecutionContext>): ExecutionContext {
    return {
      ...baseContext,
      shift: baseContext.shift || this.currentShift,
      timestamp: baseContext.timestamp || new Date().toISOString()
    };
  }

  public setShift(shiftName: string) {
    this.currentShift = shiftName;
  }
}
