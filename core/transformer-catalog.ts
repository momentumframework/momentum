import { ControllerClass } from "./controller-metadata.ts";
import { Type } from "./deps.ts";
import { MvTransformer, TransformerMetadata } from "./mv-transformer.ts";

export class TransformerCatalog {
  private static readonly globalCatalog: TransformerMetadata[] = [];
  private static readonly catalog = new Map<
    Type,
    {
      actions: {
        [action: string]: {
          parameters: TransformerMetadata[][];
          transformers: TransformerMetadata[];
        };
      };
      transformers: TransformerMetadata[];
    }
  >();

  static registerTransformer(
    transformer:
      | MvTransformer
      | Type<MvTransformer>,
    type: ControllerClass,
    action?: string,
    parameterIndex?: number,
    priority?: number,
  ) {
    let controllerRegistration = this.catalog.get(type);
    if (!controllerRegistration) {
      controllerRegistration = { actions: {}, transformers: [] };
      this.catalog.set(type, controllerRegistration);
    }
    if (!action) {
      controllerRegistration.transformers.push({ transformer, priority });
      return;
    }
    let actionRegistration = controllerRegistration.actions[action];
    if (!actionRegistration) {
      actionRegistration = { parameters: [], transformers: [] };
      controllerRegistration.actions[action] = actionRegistration;
    }
    if (parameterIndex === undefined) {
      actionRegistration.transformers.push({ transformer, priority });
      return;
    }
    let parameters = actionRegistration.parameters[parameterIndex];
    if (!parameters) {
      parameters = [];
      actionRegistration.parameters[parameterIndex] = parameters;
    }
    parameters.push({ transformer, priority });
  }

  static registerGlobalTransformer(
    transformer: MvTransformer | Type<MvTransformer>,
    priority?: number,
  ) {
    this.globalCatalog.push({ transformer, priority });
  }

  static getTransformers(
    type: ControllerClass,
    action: string,
    parameterIndex: number,
  ) {
    const transformers = [
      ...this.catalog.get(type)?.transformers ?? [],
      ...this.catalog.get(type)?.actions[action].transformers ?? [],
      ...this.catalog.get(type)?.actions[action].parameters[parameterIndex] ??
        [],
    ];
    transformers.sort((a, b) => (a?.priority ?? 0) - (b?.priority ?? 0));
    return transformers.map((t) => t.transformer);
  }
}
