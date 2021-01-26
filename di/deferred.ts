export interface Deferred<T = unknown> {
  value(): Promise<T>;
}
