import { ContextAccessor } from "./context-accessor.ts";

/**
 * A lifecycle hook that is called after the platform is bootstrapped
 */
export interface OnPlatformBootstrap {
  /**
   * A callback that is called after the platform is bootstrapped
   */
  mvOnPlatformBootstrap(): void | Promise<void>;
}

/**
 * A lifecycle hook that is called before the platform shuts down
 */
export interface OnPlatformShutdown {
  /**
   * A callback that is called before the platform shuts down
   */
  mvOnPlatformShutdown(): void | Promise<void>;
}

/**
 * A lifecycle hook that is called before a request is processed
 */
export interface OnRequestStart {
  /**
   * A callback that is called before a request is processed
   */
  mvOnRequestStart(contextAccessor: ContextAccessor): void | Promise<void>;
}

/**
 * A lifecycle hook that is called after a request is processed
 */
export interface OnRequestEnd {
  /**
   * A callback that is called after a request is processed
   */
  mvOnRequestEnd(contextAccessor: ContextAccessor): void | Promise<void>;
}
