import {
  ActionMetadata,
  ContextAccessor,
  ControllerMetadata,
  Injectable,
  MvFilter,
  NextFilterFunction,
} from "./deps.ts";
import { ViewService } from "./view.service.ts";

@Injectable()
export class MvcFilter implements MvFilter {
  constructor(private readonly viewService: ViewService) {}
  async filter(
    _contextAccessor: ContextAccessor,
    next: NextFilterFunction,
    _parameters: unknown[],
    controllerMetadata?: ControllerMetadata,
    actionMetadata?: ActionMetadata
  ): Promise<unknown> {
    const model = await next();
    if (!controllerMetadata || !actionMetadata) {
      return model;
    }
    const result = await this.viewService.renderView(
      controllerMetadata,
      actionMetadata,
      model
    );
    if (!result) {
      return model;
    }
    return result;
  }
}
