import { DependencyScope } from "./dependency-scope.ts";
import {
  DiContainer,
  NullableDependencyGraphNode,
  TypeIdentifier,
} from "./di-container.ts";

export class DependencyResolver {
  constructor(
    private readonly container: DiContainer,
    private readonly scope: DependencyScope,
  ) {
  }

  resolve<T>(identifier: TypeIdentifier) {
    const rootNode = this.container.getDependencyGraph(identifier);
    return this.resolveDependency(identifier, rootNode) as T;
  }

  private resolveDependency(
    identifier: TypeIdentifier,
    node: NullableDependencyGraphNode | undefined,
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
          Object.entries(node.props).forEach(([prop, propNode]) => {
            obj[prop] = this.resolveDependency(
              propNode.identifier,
              propNode,
            );
          });
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
