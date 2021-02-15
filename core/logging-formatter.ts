import { LogLevel } from "./log-level.ts";

export interface LoggingFormatter {
  formatMessage(
    logTime: Date,
    level: LogLevel,
    data: unknown[],
    error?: unknown,
    namespace?: string,
    loggerName?: string,
  ): unknown[];
}
