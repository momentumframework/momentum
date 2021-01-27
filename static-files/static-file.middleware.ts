import { STATIC_FILES_CONFIG } from "./contents.ts";
import {
  ContextAccessor,
  exists,
  Inject,
  Injectable,
  MvMiddleware,
  NextMiddlewareFunction,
  Optional,
  trimSlashes,
  trimTrailingSlashes,
} from "./deps.ts";
import { defaultConfig, StaticFilesConfig } from "./static-files-config.ts";

@Injectable()
export class StaticFileMiddleware implements MvMiddleware {
  readonly #config: StaticFilesConfig;

  constructor(
    @Optional()
    @Inject(STATIC_FILES_CONFIG)
    config: StaticFilesConfig
  ) {
    this.#config = {
      ...defaultConfig,
      ...config,
      mimeMap: { ...defaultConfig.mimeMap, ...config?.mimeMap },
    };
  }
  async execute(
    contextAccessor: ContextAccessor,
    next: NextMiddlewareFunction
  ) {
    const url = await contextAccessor.getUrl();
    if (url.pathname.startsWith(this.#config.serverRoot)) {
      const filePath = [
        trimTrailingSlashes(this.#config.contentRoot),
        trimSlashes(url.pathname.substring(this.#config.serverRoot.length)),
      ].join("/");
      if (await exists(filePath)) {
        const ext = filePath.substring(filePath.lastIndexOf("."));
        const contentType = this.#config.mimeMap?.[ext];
        if (contentType) {
          await contextAccessor.setHeader("Content-Type", contentType);
        }
        await contextAccessor.sendFile(filePath);
        return;
      }
    }
    await next();
  }
}
