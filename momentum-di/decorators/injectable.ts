import { DiContainer, Type, TypeIdentifier } from "../di-container.ts";

export function Injectable(): ClassDecorator;
export function Injectable(identifier: TypeIdentifier): ClassDecorator;
export function Injectable(identifier?: TypeIdentifier): ClassDecorator {
  return function (target: Function) {
    DiContainer.global().registerFromMetadata(target as Type, identifier);
  };
}