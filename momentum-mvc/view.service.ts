import { VIEW_ENGINE } from "./constants.ts";
import { Inject } from "./deps.ts";
import { ViewEngine } from "./view-engine.ts";

export class ViewService {
  readonly #viewEngine: ViewEngine;
  constructor(@Inject(VIEW_ENGINE) viewEngine: ViewEngine) {
    this.#viewEngine = viewEngine;
  }
  renderView(view: string, model: unknown) {
    return this.#viewEngine.render(view, model);
  }
}
