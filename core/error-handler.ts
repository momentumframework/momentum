import { ContextAccessor } from "./mod.ts";

/**
 * An error handler that is registered as a global error handler executes when an unhandled error occurs.
 */
export interface ErrorHandler {
  getPriority(): number;
  handleError(
    error: unknown,
    contextAccessor: ContextAccessor,
  ): void | { handled: true } | Promise<void | { handled: true }>;
}
