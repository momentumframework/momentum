import { DiContainer, Type, TypeIdentifier } from "../di-container.ts";

export function Injectable(): ClassDecorator;
export function Injectable(options: { global: boolean }): ClassDecorator;
export function Injectable(
  identifier: TypeIdentifier,
  options?: { global: boolean }
): ClassDecorator;
export function Injectable(
  identifierOrOptions?: TypeIdentifier | { global: boolean },
  options?: { global: boolean }
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
  };
}

function isIdentifier(arg: unknown): arg is TypeIdentifier {
  return typeof arg === "string" || typeof arg === "function";
}
