type Type<T = unknown> = new (...params: any[]) => T;
type Token = string;
type TypeIdentifier<T = unknown> = Type<T> | Token;

interface ObjectBlueprint {
  type: Type;
  constructorParams?: TypeIdentifier[];
  properties?: { [name: string]: TypeIdentifier };
}

interface DependencyTreeNode {
  type: Type;
  constructorParams: DependencyTreeNode[];
  properties: { [name: string]: DependencyTreeNode };
}

type PartialDependencyTreeNode = Partial<DependencyTreeNode> & {
  type: Type;
};

type DependencyGraph = Map<TypeIdentifier, DependencyTreeNode>;

export class DiContainer {
  private blueprints = new Map<TypeIdentifier, ObjectBlueprint>();

  constructor(private parent?: DiContainer) {
  }

  register(identifier: TypeIdentifier, blueprint: ObjectBlueprint) {
    if (this.getBlueprint(identifier)) {
      throw Error(
        `Unable to register ${identifier} because it is already registered.`,
      );
    }
    this.blueprints.set(identifier, blueprint);
  }

  compile() {
    return new DependencyResolver(this.buildDependencyGraph());
  }

  buildDependencyGraph() {
    const nodes: DependencyTreeNode[] = [];
    const mergedBlueprintKeys = [
      ...new Set(
        [...this.blueprints.keys(), ...(this.parent?.blueprints.keys() ?? [])],
      ),
    ];
    const graph = new Map<TypeIdentifier, DependencyTreeNode>();
    for (const identifier of mergedBlueprintKeys) {
      graph.set(identifier, this.buildTree(identifier, nodes));
    }
    for (const tree of graph.values()) {
      this.detectConstructorCycle(tree);
    }
    return graph;
  }

  private buildTree(
    identifier: TypeIdentifier,
    nodes: PartialDependencyTreeNode[],
  ) {
    const blueprint = this.getBlueprint(identifier);
    if (!blueprint) {
      throw Error(
        `Unable to resolve type ${identifier} because it is not registred.`,
      );
    }
    return this.loadNode({ type: blueprint.type }, blueprint, nodes);
  }

  private buildConstructorSubtree(
    blueprint: ObjectBlueprint,
    nodes: PartialDependencyTreeNode[],
  ) {
    if (!blueprint.constructorParams) {
      return [];
    }
    return blueprint.constructorParams.map((identifier) =>
      this.getNode(identifier, nodes)
    );
  }

  private buildPropertySubtree(
    blueprint: ObjectBlueprint,
    nodes: PartialDependencyTreeNode[],
  ) {
    if (!blueprint.properties) {
      return [];
    }
    return Object.entries(blueprint.properties)
      .map(([property, identifier]) => ({
        property,
        node: this.getNode(identifier, nodes),
      }));
  }

  private getNode(
    identifier: TypeIdentifier,
    nodes: PartialDependencyTreeNode[],
  ) {
    const blueprint = this.getBlueprint(identifier);
    if (!blueprint) {
      throw Error(`Unknown type ${identifier}`);
    }
    let node = nodes.find((node) => node.type === blueprint.type);
    if (!node) {
      node = { type: blueprint.type };
      nodes.push(node);
      this.loadNode(node, blueprint, nodes);
    }
    return node as DependencyTreeNode;
  }

  private loadNode(
    node: PartialDependencyTreeNode,
    blueprint: ObjectBlueprint,
    nodes: PartialDependencyTreeNode[],
  ) {
    node.constructorParams = this.buildConstructorSubtree(blueprint, nodes);
    node.properties = this.buildPropertySubtree(blueprint, nodes)
      .reduce(
        (previous, current) => ({
          ...previous,
          [current.property]: current.node,
        }),
        {},
      );
    return node as DependencyTreeNode;
  }

  private detectConstructorCycle(
    node: DependencyTreeNode,
    ancestors: DependencyTreeNode[] = [],
  ) {
    if (ancestors.includes(node)) {
      const path = ancestors.map((ancestor) => ancestor.type.name).join(" > ");
      throw new Error(`Circular constructor dependency detected: ${path}`);
    }
    if (!node.constructorParams) {
      return;
    }
    ancestors.push(node);
    for (const child of node.constructorParams) {
      this.detectConstructorCycle(child, [...ancestors]);
    }
  }

  private getBlueprint(
    identifier: TypeIdentifier,
  ): ObjectBlueprint | undefined {
    let blueprint = this.blueprints.get(identifier);
    if (!blueprint && this.parent) {
      blueprint = this.parent.getBlueprint(identifier);
    }
    return blueprint;
  }
}

export class DependencyResolver {
  constructor(private dependencyGraph: DependencyGraph) {
  }

  resolve<T = unknown>(identifier: TypeIdentifier) {
    const type = this.dependencyGraph;
  }
}
