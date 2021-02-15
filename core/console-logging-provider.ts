import { LOGGING_PROVIDER } from "./constants.ts";
import { Injectable } from "./deps.ts";
import { LoggingProvider } from "./logging-provider.ts";

@Injectable(LOGGING_PROVIDER)
export class ConsoleLoggingProvider implements LoggingProvider {
  info(data: unknown[]): void {
    console.info(...data);
  }
  log(data: unknown[]): void {
    console.log(...data);
  }
  warn(data: unknown[]): void {
    console.warn(...data);
  }
  error(data: unknown[]): void {
    console.error(...data);
  }
}
