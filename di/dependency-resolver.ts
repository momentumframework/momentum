import { DeferredImpl } from "./deferred-impl.ts";
import { DiCache } from "./di-cache.ts";
import {
  DiContainer,
  NullableDependencyGraphNode,
  TypeIdentifier,
} from "./di-container.ts";

export class DependencyResolver {
  readonly #container: DiContainer;
  readonly #cache: DiCache;
  constructor(container: DiContainer, cache: DiCache) {
    this.#container = container;
    this.#cache = cache;
  }

  async resolve<T>(identifier: TypeIdentifier) {
    const rootNode = this.#container.getDependencyGraph(identifier);
    return (await this.resolveDependency(identifier, rootNode)) as T;
  }

  private async resolveDependency(
    identifier: TypeIdentifier,
    node: NullableDependencyGraphNode | undefined,
    deferred?: boolean
  ) {
    const resolveFunc = async () => {
      if (!node) {
        throw Error(
          `Unknown type ${
            typeof identifier === "string" ? identifier : identifier.name
          }`
        );
      }
      // deno-lint-ignore no-explicit-any
      let value = this.#cache.get<any>(node.owner, identifier);
      if (!value) {
        switch (node.kind) {
          case "type":
            value = new node.ctor(
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
            this.#cache.set(node.scope, node.owner, identifier, value);
            await Promise.all(
              Object.entries(node.props).map(async ([prop, propNode]) => {
                value[prop] = await this.resolveDependency(
                  propNode.node.identifier,
                  propNode.node,
                  propNode.defer
                );
              })
            );
            break;
          case "factory":
            value = await node.factory(
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
            this.#cache.set(node.scope, node.owner, identifier, value);
            break;
          case "value":
            value = node.value;
            this.#cache.set(node.scope, node.owner, identifier, value);
            break;
        }
      }
      return value;
    };
    if (deferred) {
      return new DeferredImpl(resolveFunc);
    }
    return await resolveFunc();
  }
}
