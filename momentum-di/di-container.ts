export type Token = string;

// deno-lint-ignore no-explicit-any
export type Type<T = unknown> = new (...params: any[]) => T;

// deno-lint-ignore no-explicit-any
export type TypeIdentifier<T = any> = Type<T> | Token;

export type DependencyGraph = Map<TypeIdentifier, NullableDependencyTreeNode>;

type DefinitionKind = "type" | "factory" | "value";

interface Parameter {
  isOptional?: boolean;
  identifier: TypeIdentifier;
}
interface BlueprintDefinition {
  kind: "type";
  type: Type;
  params?: Parameter[];
  props?: { [name: string]: Parameter };
}
// deno-lint-ignore no-explicit-any
type FactoryFunction = (...params: any[]) => unknown;
interface FactoryDefinition {
  kind: "factory";
  factory: FactoryFunction;
  params?: Parameter[];
}
interface ValueDefinition {
  kind: "value";
  value: unknown;
}
type Definition = BlueprintDefinition | FactoryDefinition | ValueDefinition;

interface TypeDependencyTreeNode {
  identifier: TypeIdentifier;
  kind: "type";
  ctor: Type;
  params: NullableDependencyTreeNode[];
  props: { [name: string]: NullableDependencyTreeNode };
}
interface FactoryDependencyTreeNode {
  identifier: TypeIdentifier;
  kind: "factory";
  factory: FactoryFunction;
  params: NullableDependencyTreeNode[];
}
interface ValueDependencyTreeNode {
  identifier: TypeIdentifier;
  kind: "value";
  value: unknown;
}
interface NullDependencyTreeNode {
  identifier: TypeIdentifier;
  kind: "null";
}
export type DependencyTreeNode =
  | TypeDependencyTreeNode
  | ValueDependencyTreeNode
  | FactoryDependencyTreeNode;
export type NullableDependencyTreeNode =
  | DependencyTreeNode
  | NullDependencyTreeNode;

type DependencyNodeKind = DefinitionKind | "null";

type PartialDependencyTreeNode = Partial<NullableDependencyTreeNode> & {
  identifier: TypeIdentifier;
  kind: DependencyNodeKind;
};

export class DiContainer {
  private static globalContainer?: DiContainer;

  #definitions = new Map<TypeIdentifier, Definition>();
  #dependencyGraph?: DependencyGraph;

  constructor(private parent?: DiContainer) {
  }

  get dependencyGraph() {
    if (!this.#dependencyGraph) {
      this.#dependencyGraph = this.compileDependencyGraph();
    }
    return this.#dependencyGraph;
  }

  static global() {
    if (!DiContainer.globalContainer) {
      DiContainer.globalContainer = new DiContainer();
    }
    return DiContainer.globalContainer;
  }

  createChild() {
    return new DiContainer(this);
  }

  register(identifier: TypeIdentifier, definition: Definition) {
    if (this.#definitions.get(identifier)) {
      throw Error(
        `Unable to register ${identifier} because it is already registered.`,
      );
    }
    this.#definitions.set(identifier, definition);
    this.invalidateDependencyGraph();
  }

  private compileDependencyGraph() {
    const nodes: DependencyTreeNode[] = [];
    const graph = new Map<TypeIdentifier, NullableDependencyTreeNode>();
    for (const identifier of this.getDefinitionIdentifiers()) {
      graph.set(identifier, this.buildTree(identifier, nodes));
    }
    for (const tree of graph.values()) {
      this.detectCircularDependencies(tree);
    }
    return graph;
  }

  private invalidateDependencyGraph() {
    this.#dependencyGraph = undefined;
  }

  private buildTree(
    identifier: TypeIdentifier,
    nodes: PartialDependencyTreeNode[],
  ) {
    let node = nodes.find((node) => node.identifier === identifier);
    if (!node) {
      const definition = this.getDefinition(identifier);
      if (!definition) {
        throw Error(
          `Unknown type ${
            typeof identifier === "string" ? identifier : identifier.name
          }`,
        );
      }
      switch (definition.kind) {
        case "type":
          node = { identifier, kind: definition.kind };
          nodes.push(node);
          node.ctor = definition.type;
          node.params = this.buildSubtree(definition, nodes);
          node.props = this.buildPropSubtree(definition, nodes)
            .reduce(
              (previous, current) => ({
                ...previous,
                [current.prop]: current.node,
              }),
              {},
            );
          break;
        case "factory":
          node = { identifier, kind: definition.kind };
          nodes.push(node);
          node.factory = definition.factory;
          node.params = this.buildSubtree(definition, nodes);
          break;
        case "value":
          node = { identifier, kind: definition.kind };
          nodes.push(node);
          node.value = definition.value;
      }
    }
    return node as DependencyTreeNode;
  }

  private buildSubtree(
    defintion: BlueprintDefinition | FactoryDefinition,
    nodes: PartialDependencyTreeNode[],
  ) {
    if (!defintion.params) {
      return [];
    }
    return defintion.params.map((parameter) => {
      if (parameter.isOptional && !this.getDefinition(parameter.identifier)) {
        return ({
          identifier: parameter.identifier,
          kind: "null",
        }) as NullDependencyTreeNode;
      }
      return this.buildTree(parameter.identifier, nodes);
    });
  }

  private buildPropSubtree(
    blueprint: BlueprintDefinition,
    nodes: PartialDependencyTreeNode[],
  ) {
    if (!blueprint.props) {
      return [];
    }
    return Object.entries(blueprint.props)
      .map(([name, parameter]) => {
        if (parameter.isOptional && !this.getDefinition(parameter.identifier)) {
          return ({
            prop: name,
            node: {
              identifier: parameter.identifier,
              kind: "null",
            } as NullDependencyTreeNode,
          });
        }
        return ({
          prop: name,
          node: this.buildTree(parameter.identifier, nodes),
        });
      });
  }

  private detectCircularDependencies(
    node: NullableDependencyTreeNode,
    ancestors: NullableDependencyTreeNode[] = [],
  ) {
    const circular = ancestors.includes(node);
    ancestors.push(node);
    if (circular) {
      const path = ancestors
        .map((ancestor) =>
          typeof ancestor.identifier === "string"
            ? ancestor.identifier
            : ancestor.identifier.name
        )
        .join(" > ");
      throw new Error(`Circular dependency detected: ${path}`);
    }
    if (node.kind === "value" || node.kind === "null" || !node.params) {
      return;
    }
    for (const child of node.params) {
      this.detectCircularDependencies(child, [...ancestors]);
    }
  }

  private getDefinition(
    identifier: TypeIdentifier,
  ):
    | BlueprintDefinition
    | FactoryDefinition
    | ValueDefinition
    | undefined {
    let definiton = this.#definitions.get(identifier);
    if (!definiton && this.parent) {
      definiton = this.parent.getDefinition(identifier);
    }
    return definiton;
  }

  private getDefinitionIdentifiers(): TypeIdentifier[] {
    return [
      ...new Set(
        [
          ...this.#definitions.keys(),
          ...(this.parent?.getDefinitionIdentifiers() ?? []),
        ],
      ),
    ];
  }
}
