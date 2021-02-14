import {
  ActionMetadata,
  ContextAccessor,
  ControllerMetadata,
  Injectable,
  MvFilter,
  NextFilterFunction,
} from "./deps.ts";
import { ViewCatalog } from "./view-catalog.ts";
import { ViewService } from "./view.service.ts";

@Injectable()
export class MvcFilter implements MvFilter {
  constructor(private readonly viewService: ViewService) {}
  async filter(
    contextAccessor: ContextAccessor,
    next: NextFilterFunction,
    _parameters: unknown[],
    controllerMetadata?: ControllerMetadata,
    actionMetadata?: ActionMetadata,
  ): Promise<unknown> {
    const model = await next();
    if (!controllerMetadata || !actionMetadata) {
      return model;
    }

    const viewConfig = ViewCatalog.getView(
      controllerMetadata.type,
      actionMetadata.action,
    );
    if (!viewConfig) {
      return;
    }
    const templateKey =
      `${controllerMetadata.type}.${actionMetadata.action}:${viewConfig.name}`;

    const result = await this.viewService.renderView(
      templateKey,
      viewConfig,
      model,
    );

    if (!result) {
      return model;
    }

    contextAccessor.setHeader("Content-Type", "text/html");
    return result;
  }
}
