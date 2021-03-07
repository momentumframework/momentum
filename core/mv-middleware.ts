import { ContextAccessor } from "./context-accessor.ts";

export type NextMiddlewareFunction = () => Promise<void>;

/**
 * Interface that describes a middleware.
 * 
 * @remarks
 * Middleware will be executed immediately before a request is processed.
 */
export interface MvMiddleware {
  execute(
    context: ContextAccessor,
    next: NextMiddlewareFunction,
  ): Promise<void>;
}
