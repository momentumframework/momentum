import { LogLevel } from "./log-level.ts";

export interface LoggingFilter {
  filterLog(
    logTime: Date,
    level: LogLevel,
    data: unknown[],
    error?: unknown,
    namespace?: string,
    loggerName?: string,
  ): boolean;
}
