import { LOGGING_FORMATTER } from "./constants.ts";
import { Injectable } from "./deps.ts";
import { LogLevel } from "./log-level.ts";
import { LoggingFormatter } from "./logging-formatter.ts";

@Injectable(LOGGING_FORMATTER)
export class DefaultLoggingFormatter implements LoggingFormatter {
  formatMessage(
    logTime: Date,
    level: LogLevel,
    data: unknown[],
    error?: unknown,
    namespace?: string,
    loggerName?: string,
  ): unknown[] {
    const nameParts = [];
    if (namespace) {
      nameParts.push(namespace);
    }
    if (loggerName) {
      nameParts.push(loggerName);
    }
    let name = "";
    if (nameParts.length) {
      name = `${nameParts.join("::")} `;
    }
    const levelString = LogLevel[level].toUpperCase();
    const header = `${levelString} [${name}${logTime.toISOString()}]:`;
    return [
      header,
      ...data,
      error ?? "",
    ];
  }
}
