export interface ViewEngine {
  render(template: string, model: unknown): string | Promise<string>;
}
