export interface ElectronicSignature {
  id: string;
  userId: string;
  timestamp: string; // ISO string
  action: string;    // e.g. "APPROVED_BATCH", "ACKNOWLEDGED_DEVIATION"
  reason: string;
  signatureHash: string; // cryptographic hash of the signed data
}

export interface QAChecklist {
  id: string;
  batchId: string;
  checks: QACheck[];
  status: 'PENDING' | 'PASSED' | 'FAILED';
  completedBySignatureId?: string;
}

export interface QACheck {
  id: string;
  parameter: string; // e.g. "pH", "Viscosity"
  value: number | string;
  expectedRange?: { min: number, max: number };
  passed: boolean;
}

export class QualityEngine {
  async signAction(userId: string, action: string, reason: string, dataPayload: any): Promise<ElectronicSignature> {
    const signatureHash = await this.hashData(dataPayload);
    return {
      id: `sig-${Date.now()}`,
      userId,
      timestamp: new Date().toISOString(),
      action,
      reason,
      signatureHash
    };
  }

  private async hashData(data: any): Promise<string> {
    // In a real implementation, use crypto module
    return `hash-${Buffer.from(JSON.stringify(data)).toString('base64')}`;
  }
}
