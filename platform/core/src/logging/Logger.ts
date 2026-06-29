import { LogLayer, LogLevel } from '../types';

export class Logger {
  private engineName: string;

  constructor(engineName: string) {
    this.engineName = engineName;
  }

  private formatMessage(layer: LogLayer, level: LogLevel, contextId: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${layer}] [${this.engineName}] [${level}] [${contextId}] - ${message}`;
  }

  private log(layer: LogLayer, level: LogLevel, contextId: string, message: string) {
    const formatted = this.formatMessage(layer, level, contextId, message);
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      console.error(formatted);
    } else if (level === LogLevel.WARN) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  public info(layer: LogLayer, contextId: string, message: string) {
    this.log(layer, LogLevel.INFO, contextId, message);
  }

  public error(layer: LogLayer, contextId: string, message: string) {
    this.log(layer, LogLevel.ERROR, contextId, message);
  }

  public debug(layer: LogLayer, contextId: string, message: string) {
    this.log(layer, LogLevel.DEBUG, contextId, message);
  }
}
