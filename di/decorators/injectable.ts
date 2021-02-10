import { DiContainer, Type, TypeIdentifier } from "../di-container.ts";
import { Scope } from "../scope.ts";
import { Reflect } from "../shims/reflect.ts";

export type InjectableOptions =
  | {
    /**
     * Determines the scope the service will be bound to. 
     */
    scope?: Scope;
    /**
     * Determines whether to make the service available globally. If false, the type must be set as a provider in a DI container.
     */
    global?: boolean;
  }
  | {
    /**
     * Determines the scope the service will be bound to. 
     */
    scope: Scope.Custom;
    /**
     * For custom scopes, this value must be provided to act as identifier for a custom scope
     */
    scopeIdentifier: unknown;
  };

/**
 * Decorator used to mark a type as available for dependency injection globally.
 * 
 */
export function Injectable(): ClassDecorator;
/**
 * Decorator used to mark a type as available for dependency injection with options.
 */
export function Injectable(options: InjectableOptions): ClassDecorator;
/**
 * Decorator used to mark a type as available for dependency injection using a identifier token
 */
export function Injectable(
  identifier: TypeIdentifier,
  options?: InjectableOptions,
): ClassDecorator;
export function Injectable(
  identifierOrOptions?: TypeIdentifier | InjectableOptions,
  options?: InjectableOptions,
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
      DiContainer.root().registerFromMetadata(
        target as Type,
        Reflect.getMetadata("design:paramtypes", target),
        undefined,
        scope,
      );
    }
  };
}

function isIdentifier(arg: unknown): arg is TypeIdentifier {
  return typeof arg === "string" || typeof arg === "function";
}
