export enum AssetState {
  PLANNED = 'PLANNED',
  PURCHASED = 'PURCHASED',
  INSTALLED = 'INSTALLED',
  COMMISSIONED = 'COMMISSIONED',
  OPERATIONAL = 'OPERATIONAL',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  RETIRED = 'RETIRED'
}

export enum AlarmPriority {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  INFO = 'INFO'
}

export enum BatchStatus {
  PLANNED = 'PLANNED',
  RUNNING = 'RUNNING',
  HOLD = 'HOLD',
  COMPLETED = 'COMPLETED',
  ABORTED = 'ABORTED'
}

export enum LogLayer {
  APP = 'APP',
  AUDIT = 'AUDIT',
  TELEMETRY = 'TELEMETRY',
  HISTORIAN = 'HISTORIAN',
  SYSTEM = 'SYSTEM'
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export type UUID = string;
export type AssetTag = string;
export type BusinessCode = string;

export interface ICommand {
  commandId: UUID;
  type: string;
  payload: any;
  timestamp: Date;
  context?: ExecutionContext;
}

export interface IEvent {
  eventId: UUID;
  type: string;
  topic: string;
  payload: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum OrderStatus {
  CREATED = 'CREATED',
  RELEASED = 'RELEASED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface ExecutionContext {
  batchId?: UUID;
  orderId?: UUID;
  operatorId?: UUID;
  workcellId?: UUID;
  timestamp: Date;
}
