import { Type } from "./deps.ts";

export class ViewHelperCatalog {
  private static readonly catalog = new Map<Type, Set<string>>();

  static registerViewHelperContainer(type: Type) {
    this.catalog.set(type, new Set(this.catalog.get(type)));
  }

  static registerViewHelper(type: Type, helperName: string) {
    let helperNames = this.catalog.get(type);
    if (!helperNames) {
      helperNames = new Set();
      this.catalog.set(type, helperNames);
    }
    helperNames.add(helperName);
  }

  static getHelpers() {
    return this.catalog.entries();
  }
}
