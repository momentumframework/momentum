import { DeferredImpl } from "./deferred-impl.ts";
import { DiCache } from "./di-cache.ts";
import {
  DiContainer,
  FactoryDependencyGraphNode,
  NullableDependencyGraphNode,
  TypeDependencyGraphNode,
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
            return await this.buildTypeNode(node, identifier);
          case "factory":
            return await this.buildFactoryNode(node, identifier);
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

  private async buildTypeNode(
    node: TypeDependencyGraphNode,
    identifier: TypeIdentifier<unknown>
  ) {
    const params = [];
    for (const paramNode of node.params) {
      params.push(
        await this.resolveDependency(
          paramNode.node.identifier,
          paramNode.node,
          paramNode.defer
        )
      );
    }
    // deno-lint-ignore no-explicit-any
    const value: any = new node.ctor(...params);
    this.#cache.set(node.scope, node.owner, identifier, value);
    for (const [prop, propNode] of Object.entries(node.props)) {
      value[prop] = await this.resolveDependency(
        propNode.node.identifier,
        propNode.node,
        propNode.defer
      );
    }
    return value;
  }

  private async buildFactoryNode(
    node: FactoryDependencyGraphNode,
    identifier: TypeIdentifier
  ) {
    const params = [];
    for (const paramNode of node.params) {
      params.push(
        await this.resolveDependency(paramNode.node.identifier, paramNode.node)
      );
    }
    // deno-lint-ignore no-explicit-any
    const value: any = await node.factory(...params);
    this.#cache.set(node.scope, node.owner, identifier, value);
    return value;
  }
}
