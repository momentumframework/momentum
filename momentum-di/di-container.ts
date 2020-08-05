import { Reflect } from "./shims/reflect.ts";

export type Token = string;
// deno-lint-ignore no-explicit-any
export type Type<T = any> = Function & (new (...params: any[]) => T);
// deno-lint-ignore no-explicit-any
export type TypeIdentifier<T = any> = Type<T> | Token;

export type DependencyGraph = Map<TypeIdentifier, NullableDependencyGraphNode>;

type DefinitionKind = "type" | "factory" | "value";

interface Parameter {
  isOptional?: boolean;
  identifier: TypeIdentifier;
}
type PartialParameter = Partial<Parameter>;
interface TypeDefinition {
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
  params?: TypeIdentifier[];
}
interface ValueDefinition {
  kind: "value";
  value: unknown;
}
type Definition = TypeDefinition | FactoryDefinition | ValueDefinition;

export interface TypeDependencyGraphNode {
  identifier: TypeIdentifier;
  kind: "type";
  ctor: Type;
  params: NullableDependencyGraphNode[];
  props: { [name: string]: NullableDependencyGraphNode };
}
export interface FactoryDependencyGraphNode {
  identifier: TypeIdentifier;
  kind: "factory";
  factory: FactoryFunction;
  params: NullableDependencyGraphNode[];
}
export interface ValueDependencyGraphNode {
  identifier: TypeIdentifier;
  kind: "value";
  value: unknown;
}
export interface NullDependencyGraphNode {
  identifier: TypeIdentifier;
  kind: "null";
}
export type DependencyGraphNode =
  | TypeDependencyGraphNode
  | ValueDependencyGraphNode
  | FactoryDependencyGraphNode;
export type NullableDependencyGraphNode =
  | DependencyGraphNode
  | NullDependencyGraphNode;

type DependencyNodeKind = DefinitionKind | "null";

type PartialDependencyGraphNode = Partial<NullableDependencyGraphNode> & {
  identifier: TypeIdentifier;
  kind: DependencyNodeKind;
};

export class DiContainer {
  private static globalContainer?: DiContainer;

  #definitions = new Map<TypeIdentifier, Definition>();
  #ctorDefinitions = new Map<Type, Map<number, PartialParameter>>();
  #propDefinitions = new Map<Type, Map<string, PartialParameter>>();
  #dependencyGraph = new Map<TypeIdentifier, NullableDependencyGraphNode>();

  constructor(private parent?: DiContainer) {
  }

  getDependencyGraph(identifier: TypeIdentifier) {
    const partialNodes = new Map(this.#dependencyGraph);
    const graph = this.buildDependencyGraph(identifier, [], partialNodes);

    this.detectCircularDependencies(graph);

    this.#dependencyGraph.set(identifier, graph);

    return graph;
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

  registerFromMetadata(target: Type, identifier?: TypeIdentifier) {
    const paramTypes: Type[] = Reflect.getMetadata("design:paramtypes", target);
    this.register(identifier ?? target, {
      kind: "type",
      type: target,
      params: paramTypes?.map((param) => ({ identifier: param })),
    });
  }

  registerCtorParam(
    type: Type,
    paramIndex: number,
    param: PartialParameter,
  ) {
    let params = this.#ctorDefinitions.get(type);
    if (!params) {
      params = new Map<number, Parameter>();
      this.#ctorDefinitions.set(type, params);
    }
    params.set(paramIndex, param);
    this.invalidateDependencyGraph();
  }

  registerProperty(
    type: Type,
    propName: string,
    param: PartialParameter,
  ) {
    let props = this.#propDefinitions.get(type);
    if (!props) {
      props = new Map<string, PartialParameter>();
      this.#propDefinitions.set(type, props);
    }
    props.set(propName, param);
    this.invalidateDependencyGraph();
  }

  preCompileDependencyGraph() {
    this.invalidateDependencyGraph();
    const partialNodes = new Map<TypeIdentifier, PartialDependencyGraphNode>();
    for (const identifier of this.getDefinitionIdentifiers()) {
      this.#dependencyGraph.set(
        identifier,
        this.buildDependencyGraph(identifier, [], partialNodes),
      );
    }
    for (const graph of this.#dependencyGraph.values()) {
      this.detectCircularDependencies(graph);
    }
  }

  private invalidateDependencyGraph() {
    this.#dependencyGraph.clear();
  }

  private buildDependencyGraph(
    identifier: TypeIdentifier,
    path: TypeIdentifier[],
    partialNodes: Map<TypeIdentifier, PartialDependencyGraphNode>,
  ) {
    let node = partialNodes.get(identifier);
    if (!node) {
      const definition = this.getDefinition(identifier);
      if (!definition) {
        const pathString = path
          .map((pathIdentifier) =>
            typeof pathIdentifier === "string"
              ? pathIdentifier
              : pathIdentifier.name
          )
          .join(" > ");
        throw Error(
          `Unable to inject unregisterd type ${
            typeof identifier === "string" ? identifier : identifier.name
          } into ${pathString}`,
        );
      }
      path.push(identifier);
      switch (definition.kind) {
        case "type":
          node = { identifier, kind: definition.kind };
          partialNodes.set(identifier, node);
          node.ctor = definition.type;
          node.params = this.buildCtorSubtree(definition, path, partialNodes);
          node.props = this.buildPropSubtree(definition, path, partialNodes)
            .reduce((previous, current) => ({
              ...previous,
              [current.prop]: current.node,
            }), {});
          break;
        case "factory":
          node = { identifier, kind: definition.kind };
          partialNodes.set(identifier, node);
          node.factory = definition.factory;
          node.params = this.buildFactorySubtree(
            definition,
            path,
            partialNodes,
          );
          break;
        case "value":
          node = { identifier, kind: definition.kind };
          partialNodes.set(identifier, node);
          node.value = definition.value;
      }
    }
    return node as DependencyGraphNode;
  }

  private buildCtorSubtree(
    definition: TypeDefinition,
    path: TypeIdentifier[],
    nodes: Map<TypeIdentifier, PartialDependencyGraphNode>,
  ) {
    const ctorParms = this.#ctorDefinitions.get(definition.type)?.entries();
    if (!definition.params && !ctorParms) {
      return [];
    }
    return Array.from(ctorParms ?? []).reduce(
      (params, [index, parameter]) => {
        params[index] = { ...params[index], ...parameter };
        return params;
      },
      definition.params ?? [],
    ).map((parameter) => {
      if (parameter.isOptional && !this.getDefinition(parameter.identifier)) {
        return ({
          identifier: parameter.identifier,
          kind: "null",
        }) as NullDependencyGraphNode;
      }
      return this.buildDependencyGraph(parameter.identifier, path, nodes);
    });
  }

  private buildPropSubtree(
    definition: TypeDefinition,
    path: TypeIdentifier[],
    nodes: Map<TypeIdentifier, PartialDependencyGraphNode>,
  ) {
    const props = this.#propDefinitions.get(definition.type)?.entries();
    if (!definition.props && !props) {
      return [];
    }
    return Object.entries(
      Array.from(props ?? []).reduce(
        (props, [propName, parameter]) => {
          props[propName] = { ...props[propName], ...parameter };
          return props;
        },
        definition.props ?? {},
      ),
    ).map(([name, parameter]) => {
      if (parameter.isOptional && !this.getDefinition(parameter.identifier)) {
        return ({
          prop: name,
          node: {
            identifier: parameter.identifier,
            kind: "null",
          },
        });
      }
      return ({
        prop: name,
        node: this.buildDependencyGraph(parameter.identifier, path, nodes),
      });
    });
  }

  private buildFactorySubtree(
    defintion: FactoryDefinition,
    path: TypeIdentifier[],
    nodes: Map<TypeIdentifier, PartialDependencyGraphNode>,
  ) {
    if (!defintion.params) {
      return [];
    }
    return defintion.params.map((parameter) => {
      return this.buildDependencyGraph(parameter, path, nodes);
    });
  }

  private detectCircularDependencies(
    node: NullableDependencyGraphNode,
    ancestors: NullableDependencyGraphNode[] = [],
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
    | TypeDefinition
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
