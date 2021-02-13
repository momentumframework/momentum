/**
 * Represents an injectable that can be injected at any time, 
 * but will not be resolved until a call is made to the value property.
 */
export interface Deferred<T = unknown> {
  value(): Promise<T>;
}
