import { CONFIG } from "./constants.ts";
import { HandlebarsConfig, Inject, Injectable, Optional } from "./deps.ts";
import { ViewEngine } from "../momentum-mvc/view-engine.ts";

@Injectable()
export class HandlebarsViewEngine implements ViewEngine {
  readonly #config: HandlebarsConfig;
  constructor(
    @Optional()
    @Inject(CONFIG)
    config: HandlebarsConfig
  ) {
    this.#config = config;
  }

  render(template: string, model: unknown) {
    return JSON.stringify({ template, model, config: this.#config });
  }
}
