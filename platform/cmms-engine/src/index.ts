export interface WorkOrder {
  id: string;
  equipmentId: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}

export class CMMSEngine {
  private workOrders: Map<string, WorkOrder> = new Map();

  async createWorkOrder(equipmentId: string, faultReason: string): Promise<WorkOrder> {
    const workOrder: WorkOrder = {
      id: `wo-${Date.now()}`,
      equipmentId,
      description: `Auto-generated from Equipment Fault: ${faultReason}`,
      priority: 'HIGH',
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
    
    this.workOrders.set(workOrder.id, workOrder);
    
    // In a real implementation, this might forward to SAP PM / Maximo via webhook
    console.log(`[CMMS] Created Work Order ${workOrder.id} for equipment ${equipmentId}`);
    
    return workOrder;
  }

  getWorkOrders(equipmentId?: string): WorkOrder[] {
    const all = Array.from(this.workOrders.values());
    if (equipmentId) {
      return all.filter(wo => wo.equipmentId === equipmentId);
    }
    return all;
  }
}
