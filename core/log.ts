import {
  LOGGER_NAME,
  LOGGER_NAMESPACE,
  LOGGING_FILTER,
  LOGGING_FORMATTER,
  LOGGING_PROVIDER,
} from "./constants.ts";
import { Inject, Injectable, Optional } from "./deps.ts";
import { LogLevel } from "./log-level.ts";
import { LoggingFilter } from "./logging-filter.ts";
import { LoggingFormatter } from "./logging-formatter.ts";
import { LoggingProvider } from "./logging-provider.ts";

@Injectable()
export class Log {
  @Optional()
  @Inject(LOGGER_NAMESPACE)
  namespace?: string;
  @Optional()
  @Inject(LOGGER_NAME)
  loggerName?: string;
  constructor(
    @Inject(LOGGING_PROVIDER) private readonly loggingProvider: LoggingProvider,
    @Inject(LOGGING_FORMATTER) private readonly formatter: LoggingFormatter,
    @Optional()
    @Inject(LOGGING_FILTER)
    private readonly loggingFilter?: LoggingFilter,
  ) {
  }
  info(...data: unknown[]): void {
    const logTime = new Date();
    try {
      if (
        this.loggingFilter &&
        !this.loggingFilter.filterLog(
          logTime,
          LogLevel.Info,
          data,
          undefined,
          this.namespace,
          this.loggerName,
        )
      ) {
        return;
      }
      const logMessage = this.formatter.formatMessage(
        logTime,
        LogLevel.Info,
        data,
        undefined,
        this.namespace,
        this.loggerName,
      );
      this.loggingProvider.info(logMessage);
      // deno-lint-ignore no-empty
    } catch {}
  }
  log(...data: unknown[]): void {
    const logTime = new Date();
    try {
      if (
        this.loggingFilter &&
        !this.loggingFilter.filterLog(
          logTime,
          LogLevel.Log,
          data,
          undefined,
          this.namespace,
          this.loggerName,
        )
      ) {
        return;
      }
      const logMessage = this.formatter.formatMessage(
        logTime,
        LogLevel.Log,
        data,
        undefined,
        this.namespace,
        this.loggerName,
      );
      this.loggingProvider.log(logMessage);
      // deno-lint-ignore no-empty
    } catch {}
  }
  warn(...data: unknown[]): void {
    const logTime = new Date();
    try {
      if (
        this.loggingFilter &&
        !this.loggingFilter.filterLog(
          logTime,
          LogLevel.Warn,
          data,
          undefined,
          this.namespace,
          this.loggerName,
        )
      ) {
        return;
      }
      const logMessage = this.formatter.formatMessage(
        logTime,
        LogLevel.Warn,
        data,
        undefined,
        this.namespace,
        this.loggerName,
      );
      this.loggingProvider.warn(logMessage);
      // deno-lint-ignore no-empty
    } catch {}
  }
  error(error?: unknown, ...data: unknown[]): void {
    const logTime = new Date();
    try {
      if (
        this.loggingFilter &&
        !this.loggingFilter.filterLog(
          logTime,
          LogLevel.Error,
          data,
          error,
          this.namespace,
          this.loggerName,
        )
      ) {
        return;
      }
      const logMessage = this.formatter.formatMessage(
        logTime,
        LogLevel.Error,
        data,
        error,
        this.namespace,
        this.loggerName,
      );
      this.loggingProvider.error(logMessage);
      // deno-lint-ignore no-empty
    } catch {}
  }
}
