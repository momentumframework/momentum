import { TypeIdentifier } from "./mod.ts";

export class ScopeCatalog {
  private static readonly catalog = new Map<TypeIdentifier, unknown>();

  static registerScopeIdentifier(
    typeIdentifier: TypeIdentifier,
    scopeIdentifier: unknown
  ) {
    this.catalog.set(typeIdentifier, scopeIdentifier);
  }

  static getScopeIdentifier(typeIdentifier: TypeIdentifier) {
    return this.catalog.get(typeIdentifier);
  }
}
