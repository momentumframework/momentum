import { DiContainer, Type, TypeIdentifier } from "../di-container.ts";
import { Scope } from "../scope.ts";

export type InjectableOptions =
  | { scope?: Scope; global?: boolean }
  | {
      scope: Scope.Custom;
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
    options = { scope: Scope.Injection, global: true, ...options };
    let scope: Scope | string | undefined = options.scope;
    if (scope === Scope.Custom) {
      scope = (options as { scopeIdentifier: string }).scopeIdentifier;
    }
    if (identifier) {
      DiContainer.root().registerAlias(target as Type, identifier);
    }
    if (options.global) {
      DiContainer.root().registerFromMetadata(target as Type, undefined, scope);
    }
  };
}

function isIdentifier(arg: unknown): arg is TypeIdentifier {
  return typeof arg === "string" || typeof arg === "function";
}
