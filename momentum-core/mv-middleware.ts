export interface MvMiddleware {
  execute(context: unknown, next: () => Promise<unknown>): Promise<unknown>;
}
