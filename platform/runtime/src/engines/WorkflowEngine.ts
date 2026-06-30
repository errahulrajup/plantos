import { IStateMachineProvider, IStateMachine } from '../interfaces/IStateMachineProvider';

/**
 * Manages the ISA-88 standard Batch Workflow State Machines.
 * Note: A workflow is distinct from equipment. A workflow orchestrates 
 * transitions (e.g. Draft -> Allocated -> Ready -> Running).
 */
export class WorkflowEngine {
  private provider: IStateMachineProvider;
  private activeWorkflows: Map<string, IStateMachine> = new Map();

  constructor(provider: IStateMachineProvider) {
    this.provider = provider;
  }

  public initializeWorkflow(workflowId: string) {
    const machine = this.provider.createMachine({
      id: workflowId,
      initial: 'Draft',
      states: {
        Draft: { on: { ALLOCATE: 'Allocated' } },
        Allocated: { on: { VERIFY: 'Ready', DEALLOCATE: 'Draft' } },
        Ready: { on: { START: 'Running' } },
        Running: { on: { PAUSE: 'Paused', COMPLETE: 'Completed', FAULT: 'Fault' } },
        Paused: { on: { RESUME: 'Running', ABORT: 'Archived' } },
        Completed: { on: { RELEASE: 'Released' } },
        Released: { on: { ARCHIVE: 'Archived' } },
        Fault: { on: { RECOVER: 'Paused', ABORT: 'Archived' } },
        Archived: { type: 'final' }
      }
    });

    machine.onTransition((state) => {
      console.log(`[WorkflowEngine] ${workflowId} transitioned to ${state}`);
    });

    machine.start();
    this.activeWorkflows.set(workflowId, machine);
  }

  public evaluateTransition(workflowId: string, event: string) {
    const machine = this.activeWorkflows.get(workflowId);
    if (machine) {
      machine.send({ type: event });
    }
  }
}
