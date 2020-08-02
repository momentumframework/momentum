import { DependencyScope } from "./dependency-scope.ts";
import {
  DiContainer,
  NullableDependencyTreeNode,
  TypeIdentifier,
} from "./di-container.ts";

export class DependencyResolver {
  constructor(
    private container: DiContainer,
    private scope: DependencyScope,
  ) {
  }

  resolve<T = unknown>(identifier: TypeIdentifier) {
    const rootNode = this.container.dependencyGraph.get(identifier);
    return this.resolveDependency(identifier, rootNode) as T;
  }

  private resolveDependency(
    identifier: TypeIdentifier,
    node: NullableDependencyTreeNode | undefined,
  ) {
    if (!node) {
      throw Error(
        `Unknown type ${
          typeof identifier === "string" ? identifier : identifier.name
        }`,
      );
    }
    let obj = this.scope.get(identifier);
    if (!obj) {
      switch (node.kind) {
        case "type":
          obj = new node.ctor(
            ...node.params.map((paramNode) =>
              this.resolveDependency(paramNode.identifier, paramNode)
            ),
          );
          this.scope.set(identifier, obj);
          for (const [prop, propNode] of Object.entries(node.props)) {
            (obj as Record<string, unknown>)[prop] = this.resolveDependency(
              propNode.identifier,
              propNode,
            );
          }
          break;
        case "factory":
          obj = node.factory(
            ...node.params.map((paramNode) =>
              this.resolveDependency(paramNode.identifier, paramNode)
            ),
          );
          this.scope.set(identifier, obj);
          break;
        case "value":
          obj = node.value;
          this.scope.set(identifier, obj);
          break;
        case "null":
          obj = undefined;
          this.scope.set(identifier, undefined);
      }
    }
    return obj;
  }
}
