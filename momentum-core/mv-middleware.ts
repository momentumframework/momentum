export type NextMiddleware = () => Promise<void>;

export interface MvMiddleware {
  execute(context: unknown, next: NextMiddleware): Promise<void>;
}
