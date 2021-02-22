import { STATIC_FILES_CONFIG } from "./contents.ts";
import {
  DynamicModule,
  Inject,
  MvModule,
  PLATFORM,
  ServerPlatform,
} from "./deps.ts";
import { StaticFileMiddleware } from "./static-file.middleware.ts";
import { StaticFilesConfig } from "./static-files-config.ts";

/**
 * Include this module in your application to enable serving static files
 */
@MvModule({
  providers: [StaticFileMiddleware],
})
export class StaticFileModule {
  static register(config: Partial<StaticFilesConfig>): DynamicModule {
    return {
      type: StaticFileModule,
      providers: [
        {
          provide: STATIC_FILES_CONFIG,
          useValue: config,
        },
      ],
    };
  }

  constructor(
    @Inject(PLATFORM) platform: ServerPlatform,
    staticFileMiddleware: StaticFileMiddleware,
  ) {
    platform.use(staticFileMiddleware);
  }
}
