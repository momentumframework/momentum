import { DeferredImpl } from "./deferred-impl.ts";
import { DependencyScope } from "./dependency-scope.ts";
import {
  DiContainer,
  NullableDependencyGraphNode,
  TypeIdentifier,
} from "./di-container.ts";

export class DependencyResolver {
  constructor(
    private readonly container: DiContainer,
    private readonly scope: DependencyScope
  ) {}

  async resolve<T>(identifier: TypeIdentifier) {
    const rootNode = this.container.getDependencyGraph(identifier);
    return (await this.resolveDependency(identifier, rootNode)) as T;
  }

  private async resolveDependency(
    identifier: TypeIdentifier,
    node: NullableDependencyGraphNode | undefined,
    deferred?: boolean
  ) {
    const getter = async () => {
      if (!node) {
        throw Error(
          `Unknown type ${
            typeof identifier === "string" ? identifier : identifier.name
          }`
        );
      }
      // deno-lint-ignore no-explicit-any
      let obj = this.scope.get<any>(identifier);
      if (!obj) {
        switch (node.kind) {
          case "type":
            obj = new node.ctor(
              ...(await Promise.all(
                node.params.map(
                  async (paramNode) =>
                    await this.resolveDependency(
                      paramNode.node.identifier,
                      paramNode.node,
                      paramNode.defer
                    )
                )
              ))
            );
            this.scope.set(identifier, obj);
            await Promise.all(
              Object.entries(node.props).map(async ([prop, propNode]) => {
                obj[prop] = await this.resolveDependency(
                  propNode.node.identifier,
                  propNode.node,
                  propNode.defer
                );
              })
            );
            break;
          case "factory":
            obj = await node.factory(
              ...(await Promise.all(
                node.params.map(
                  async (paramNode) =>
                    await this.resolveDependency(
                      paramNode.node.identifier,
                      paramNode.node
                    )
                )
              ))
            );
            this.scope.set(identifier, obj);
            break;
          case "value":
            obj = node.value;
            this.scope.set(identifier, obj);
            break;
        }
      }
      return obj;
    };
    if (deferred) {
      return new DeferredImpl(getter);
    }
    return await getter();
  }
}
