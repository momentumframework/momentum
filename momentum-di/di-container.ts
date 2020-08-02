type Type<T = unknown> = new (...params: any[]) => T;
type Token = string;
type TypeIdentifier<T = unknown> = Type<T> | Token;

type DefinitionKind = "type" | "factory" | "value";

interface BlueprintDefinition {
  kind: "type";
  type: Type;
  params?: TypeIdentifier[];
  props?: { [name: string]: TypeIdentifier };
}
type FactoryFunction = (...params: any[]) => unknown;
interface FactoryDefinition {
  kind: "factory";
  factory: FactoryFunction;
  params?: TypeIdentifier[];
}
interface ValueDefinition {
  kind: "value";
  value: unknown;
}
type Definition = BlueprintDefinition | FactoryDefinition | ValueDefinition;

export interface TypeDependencyTreeNode {
  identifier: TypeIdentifier;
  kind: "type";
  ctor: Type;
  params: DependencyTreeNode[];
  props: { [name: string]: DependencyTreeNode };
}
export interface FactoryDependencyTreeNode {
  identifier: TypeIdentifier;
  kind: "factory";
  factory: FactoryFunction;
  params: DependencyTreeNode[];
}
export interface ValueDependencyTreeNode {
  identifier: TypeIdentifier;
  kind: "value";
  value: unknown;
}
export type DependencyTreeNode =
  | TypeDependencyTreeNode
  | ValueDependencyTreeNode
  | FactoryDependencyTreeNode;

type PartialDependencyTreeNode = Partial<DependencyTreeNode> & {
  identifier: TypeIdentifier;
  kind: DefinitionKind;
};

export type DependencyGraph = Map<TypeIdentifier, DependencyTreeNode>;

export class DiContainer {
  private definitions = new Map<TypeIdentifier, Definition>();

  constructor(private parent?: DiContainer) {
  }

  register(identifier: TypeIdentifier, definition: Definition) {
    if (this.definitions.get(identifier)) {
      throw Error(
        `Unable to register ${identifier} because it is already registered.`,
      );
    }
    this.definitions.set(identifier, definition);
  }

  compile(scope: DependencyScope) {
    return new DependencyResolver(this.buildDependencyGraph(), scope);
  }

  buildDependencyGraph() {
    const nodes: DependencyTreeNode[] = [];
    const graph = new Map<TypeIdentifier, DependencyTreeNode>();
    for (const identifier of this.getDefinitionIdentifiers()) {
      graph.set(identifier, this.buildTree(identifier, nodes));
    }
    for (const tree of graph.values()) {
      this.detectCircularDependencies(tree);
    }
    return graph;
  }

  private buildTree(
    identifier: TypeIdentifier,
    nodes: PartialDependencyTreeNode[],
  ) {
    let node = nodes.find((node) => node.identifier === identifier);
    if (!node) {
      const definition = this.getDefinition(identifier);
      if (!definition) {
        throw Error(`Unknown type ${identifier}`);
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
    return defintion.params.map((identifier) =>
      this.buildTree(identifier, nodes)
    );
  }

  private buildPropSubtree(
    blueprint: BlueprintDefinition,
    nodes: PartialDependencyTreeNode[],
  ) {
    if (!blueprint.props) {
      return [];
    }
    return Object.entries(blueprint.props)
      .map(([prop, identifier]) => ({
        prop: prop,
        node: this.buildTree(identifier, nodes),
      }));
  }

  private detectCircularDependencies(
    node: DependencyTreeNode,
    ancestors: DependencyTreeNode[] = [],
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
    if (node.kind === "value" || !node.params) {
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
    let definiton = this.definitions.get(identifier);
    if (!definiton && this.parent) {
      definiton = this.parent.getDefinition(identifier);
    }
    return definiton;
  }

  private getDefinitionIdentifiers(): TypeIdentifier[] {
    return [
      ...new Set(
        [
          ...this.definitions.keys(),
          ...(this.parent?.getDefinitionIdentifiers() ?? []),
        ],
      ),
    ];
  }
}

export class DependencyScope {
  private isEnded = false;
  private cache = new Map<TypeIdentifier, unknown>();

  constructor(private parent?: DependencyScope) {
  }

  static beginScope() {
    return new DependencyScope();
  }

  beginSubScope() {
    return new DependencyScope(this);
  }

  endScope() {
    this.cache.clear();
  }

  set(identifier: TypeIdentifier, obj: unknown) {
    if (this.isEnded) {
      throw Error("Scope is ended");
    }
    this.cache.set(identifier, obj);
  }

  get(identifier: TypeIdentifier) {
    if (this.isEnded) {
      throw Error("Scope is ended");
    }
    let obj = this.cache.get(identifier);
    if (!obj && this.parent) {
      obj = this.parent.get(identifier);
    }
    return obj;
  }
}

export class DependencyResolver {
  constructor(
    private dependencyGraph: DependencyGraph,
    private scope: DependencyScope,
  ) {
  }

  resolve<T = unknown>(identifier: TypeIdentifier) {
    const node = this.dependencyGraph.get(identifier);
    if (!node) {
      throw Error(`Unknown type ${identifier}`);
    }
    let obj = this.scope.get(identifier);
    if (!obj) {
      switch (node.kind) {
        case "type":
          obj = new node.ctor(
            ...node.params.map((param) => this.resolve(param.identifier)),
          );
          this.scope.set(identifier, obj);
          const propBag = obj as Record<string, unknown>;
          for (const [prop, propNode] of Object.entries(node.props)) {
            propBag[prop] = this.resolve(
              propNode.identifier,
            );
          }
          break;
        case "factory":
          obj = node.factory(
            ...node.params.map((param) => this.resolve(param.identifier)),
          );
          this.scope.set(identifier, obj);
          break;
        case "value":
          obj = node.value;
          this.scope.set(identifier, obj);
      }
    }
    return obj;
  }
}
