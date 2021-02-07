export interface CommandHandler<T> {
  handle(commandParameters: T): void | Promise<void>;
}
