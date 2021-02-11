/**
 * Defines the lifetime of a dependency
 */
export enum Scope {
  /**
   * Transient dependencies are created every time it is needed.
   */
  Transient,
  /**
   * Injection scoped dependencies are created once per resolve call, and reused within the scope. 
   * 
   * This scope is the default.
   */
  Injection,
  /**
   * Singleton scoped dependencies are created once and reused for the lifetime of the application
   */
  Singleton,
  /**
   * Request scoped dependencies are created once and reused for the lifetime of a single request. 
   */
  Request,
  /**
   * Custom scoped dependencies allow custom named scopes to be defined. 
   * The lifetime of dependencies in a custom scoped are controlled by the owner of the scope.
   */
  Custom,
}
