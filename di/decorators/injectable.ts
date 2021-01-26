import { DiContainer, Type, TypeIdentifier } from "../di-container.ts";
import { ScopeCatalog } from "../scope-catalog.ts";
import { Scope } from "../scope.ts";

export type InjectableOptions =
  | { scope?: Scope; global?: boolean }
  | {
      scope: Scope.Custom;
      global?: boolean;
      scopeIdentifier: unknown;
    };

export function Injectable(): ClassDecorator;
export function Injectable(options: InjectableOptions): ClassDecorator;
export function Injectable(
  identifier: TypeIdentifier,
  options?: InjectableOptions
): ClassDecorator;
export function Injectable(
  identifierOrOptions?: TypeIdentifier | InjectableOptions,
  options?: InjectableOptions
): ClassDecorator {
  // deno-lint-ignore ban-types
  return function (target: Function) {
    let identifier;
    if (identifierOrOptions) {
      if (isIdentifier(identifierOrOptions)) {
        identifier = identifierOrOptions;
      } else {
        options = identifierOrOptions;
      }
    }
    if (identifier) {
      DiContainer.root().registerAlias(target as Type, identifier);
    }
    if (options?.global) {
      DiContainer.root().registerFromMetadata(target as Type);
    }
    if (options?.scope) {
      if (options.scope === Scope.Custom) {
        ScopeCatalog.registerScopeIdentifier(
          identifier as Type,
          (options as { scopeIdentifier: string }).scopeIdentifier
        );
      } else {
        ScopeCatalog.registerScopeIdentifier(identifier as Type, options.scope);
      }
    }
  };
}

function isIdentifier(arg: unknown): arg is TypeIdentifier {
  return typeof arg === "string" || typeof arg === "function";
}
