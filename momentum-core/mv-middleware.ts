export type NextMiddlewareFunction = () => Promise<void>;

export interface MvMiddleware {
  execute(context: unknown, next: NextMiddlewareFunction): Promise<void>;
}
