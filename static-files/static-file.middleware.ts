import { STATIC_FILES_CONFIG } from "./contents.ts";
import {
  exists,
  Inject,
  Injectable,
  MvMiddleware,
  NextMiddlewareFunction,
  PLATFORM,
  ServerPlatform,
  trimSlashes,
  trimTrailingSlashes,
} from "./deps.ts";
import { defaultConfig, StaticFilesConfig } from "./static-files-config.ts";

@Injectable()
export class StaticFileMiddleware implements MvMiddleware {
  readonly #platform: ServerPlatform;
  readonly #config: StaticFilesConfig;

  constructor(
    @Inject(PLATFORM)
    platform: ServerPlatform,
    @Inject(STATIC_FILES_CONFIG)
    config: StaticFilesConfig
  ) {
    this.#platform = platform;
    this.#config = {
      ...defaultConfig,
      ...config,
      mimeMap: { ...defaultConfig.mimeMap, ...config?.mimeMap },
    };
  }
  async execute(context: unknown, next: NextMiddlewareFunction) {
    const url = (await this.#platform.getContextItem("url", context)) as URL;
    if (url.pathname.startsWith(this.#config.serverRoot)) {
      const filePath = [
        trimTrailingSlashes(this.#config.contentRoot),
        trimSlashes(url.pathname.substring(this.#config.serverRoot.length)),
      ].join("/");
      if (await exists(filePath)) {
        const ext = filePath.substring(filePath.lastIndexOf("."));
        const contentType = this.#config.mimeMap?.[ext];
        if (contentType) {
          await this.#platform.setContextItem(
            "header",
            context,
            contentType,
            "Content-Type"
          );
        }
        await this.#platform.sendFile(context, filePath);
        return;
      }
    }
    await next();
  }
}
