export interface LoggingProvider {
  info(data: unknown[]): void;
  log(data: unknown[]): void;
  warn(data: unknown[]): void;
  error(data: unknown[]): void;
}
