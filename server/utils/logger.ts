import fs from "fs";
import path from "path";

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  source: string;
  action: string;
  ip_address?: string;
  mac_address?: string;
  user_agent?: string;
  request_id?: string;
  duration_ms?: number;
  file_size?: number;
  file_name?: string;
  cnic?: string;
  error?: string;
  details?: any;
}

export class Logger {
  private logFilePath: string;

  constructor(logFileName: string) {
    this.logFilePath = path.join(
      logsDir,
      `${logFileName}_${this.getDateString()}.log`,
    );
  }

  private getDateString(): string {
    return new Date().toISOString().split("T")[0];
  }

  private formatLogEntry(entry: LogEntry): string {
    const logLine = {
      timestamp: entry.timestamp,
      level: entry.level,
      source: entry.source,
      action: entry.action,
      ...(entry.ip_address && { ip_address: entry.ip_address }),
      ...(entry.mac_address && { mac_address: entry.mac_address }),
      ...(entry.user_agent && { user_agent: entry.user_agent }),
      ...(entry.request_id && { request_id: entry.request_id }),
      ...(entry.duration_ms && { duration_ms: entry.duration_ms }),
      ...(entry.file_size && { file_size: entry.file_size }),
      ...(entry.file_name && { file_name: entry.file_name }),
      ...(entry.cnic && { cnic: entry.cnic }),
      ...(entry.error && { error: entry.error }),
      ...(entry.details && { details: entry.details }),
    };

    return JSON.stringify(logLine) + "\n";
  }

  log(entry: Omit<LogEntry, "timestamp">): void {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    const logLine = this.formatLogEntry(fullEntry);

    try {
      fs.appendFileSync(this.logFilePath, logLine, "utf8");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  info(source: string, action: string, data?: Partial<LogEntry>): void {
    this.log({
      level: "INFO",
      source,
      action,
      ...data,
    });
  }

  warn(source: string, action: string, data?: Partial<LogEntry>): void {
    this.log({
      level: "WARN",
      source,
      action,
      ...data,
    });
  }

  error(
    source: string,
    action: string,
    error: string,
    data?: Partial<LogEntry>,
  ): void {
    this.log({
      level: "ERROR",
      source,
      action,
      error,
      ...data,
    });
  }

  debug(source: string, action: string, data?: Partial<LogEntry>): void {
    this.log({
      level: "DEBUG",
      source,
      action,
      ...data,
    });
  }
}

// Pre-configured loggers for different routes
export const voiceLogger = new Logger("voice_upload");
export const heartbeatLogger = new Logger("heartbeat");
