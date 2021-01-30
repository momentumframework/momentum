import { EventEmitter } from "./deps.ts";
import { Scope } from "./scope.ts";
import { Reflect } from "./shims/reflect.ts";

export type Token = string;
// deno-lint-ignore no-explicit-any ban-types
export type Type<T = any> = Function & (new (...params: any[]) => T);
// deno-lint-ignore no-explicit-any
export type TypeIdentifier<T = any> = Type<T> | Token;

export type DependencyGraph = Map<TypeIdentifier, DependencyGraphNode>;

const defaultScope = Scope.Injection;

type DefinitionKind = "type" | "factory" | "value";

interface Parameter {
  isOptional?: boolean;
  defer?: boolean;
  identifier: TypeIdentifier;
}
type PartialParameter = Partial<Parameter>;

export interface TypeDefinition {
  kind: "type";
  type: Type;
  params?: Parameter[];
  props?: { [name: string]: Parameter };
  scope: Scope | string;
}
// deno-lint-ignore no-explicit-any
export type FactoryFunction<T = unknown> = (...params: any[]) => T;
interface FactoryDefinition {
  kind: "factory";
  factory: FactoryFunction;
  params?: TypeIdentifier[];
  scope: Scope | string;
}
interface ValueDefinition {
  kind: "value";
  value: unknown;
  scope: Scope | string;
}
type Definition = TypeDefinition | FactoryDefinition | ValueDefinition;

interface TypeDependencyGraphParmeter {
  node: NullableDependencyGraphNode;
  defer?: boolean;
}

interface ScopedDependencyGraphNode {
  owner: DiContainer;
  scope: Scope | string;
}
export interface TypeDependencyGraphNode extends ScopedDependencyGraphNode {
  identifier: TypeIdentifier;
  kind: "type";
  ctor: Type;
  params: TypeDependencyGraphParmeter[];
  props: {
    [name: string]: TypeDependencyGraphParmeter;
  };
}
export interface FactoryDependencyGraphNode extends ScopedDependencyGraphNode {
  identifier: TypeIdentifier;
  kind: "factory";
  factory: FactoryFunction;
  params: { node: DependencyGraphNode }[];
}
export interface ValueDependencyGraphNode extends ScopedDependencyGraphNode {
  identifier: TypeIdentifier;
  kind: "value";
  value: unknown;
}
export interface NullDependencyGraphNode
  extends Pick<ScopedDependencyGraphNode, "owner"> {
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
  private static rootContainer?: DiContainer;

  #name: string;
  #parent?: DiContainer;
  #events = new EventEmitter<{
    clearGraph(): void;
    changeGraph(type: TypeIdentifier): void;
  }>();
  #imports = new Map<TypeIdentifier, DiContainer>();
  #aliases = new Map<TypeIdentifier, TypeIdentifier>();
  #definitions = new Map<TypeIdentifier, Definition>();
  #ctorOverrides = new Map<Type, Map<number, PartialParameter[]>>();
  #propOverrides = new Map<Type, Map<string, PartialParameter[]>>();
  #dependencyGraph = new Map<
    DiContainer,
    Map<TypeIdentifier, NullableDependencyGraphNode>
  >();

  constructor(name: string, parent?: DiContainer) {
    this.#parent = parent;
    this.#name = name;
    if (this.#parent) {
      this.#parent.#events.on("changeGraph", (identifier) =>
        this.partialInvalidateDependencyGraph(identifier)
      );
      this.#parent.#events.on("clearGraph", () =>
        this.invalidateDependencyGraph()
      );
    }
  }

  get name() {
    return this.#name;
  }

  get qualifiedName() {
    if (!this.#parent) {
      return this.name;
    }
    return `${this.#parent?.name}.${this.#name}`;
  }

  static root() {
    if (!DiContainer.rootContainer) {
      DiContainer.rootContainer = new DiContainer("root");
    }
    return DiContainer.rootContainer;
  }

  createChild(name: string) {
    return new DiContainer(name, this);
  }

  createSibling(name: string) {
    return new DiContainer(name, this.#parent);
  }

  getDependencyGraph(identifier: TypeIdentifier) {
    const partialNodes = new Map(this.#dependencyGraph);
    const graph = this.buildDependencyGraph(identifier, [], partialNodes);

    this.detectCircularDependencies(graph);

    if (this.#dependencyGraph.has(this)) {
      this.#dependencyGraph.get(this)?.set(identifier, graph);
    } else {
      this.#dependencyGraph.set(this, new Map([[identifier, graph]]));
    }
    return graph;
  }

  preCompileDependencyGraph() {
    this.invalidateDependencyGraph();
    const partialNodes = new Map<
      DiContainer,
      Map<TypeIdentifier, PartialDependencyGraphNode>
    >();
    for (const identifier of this.getDefinitionIdentifiers()) {
      const graph = this.buildDependencyGraph(identifier, [], partialNodes);
      if (this.#dependencyGraph.has(this)) {
        this.#dependencyGraph.get(this)?.set(identifier, graph);
      } else {
        this.#dependencyGraph.set(this, new Map([[identifier, graph]]));
      }
    }
    for (const containerGraphs of this.#dependencyGraph.values()) {
      for (const graph of containerGraphs.values()) {
        this.detectCircularDependencies(graph);
      }
    }
  }

  isRegistered(identifier: TypeIdentifier) {
    return this.#definitions.has(identifier);
  }

  import(identifier: TypeIdentifier, container: DiContainer) {
    this.#imports.set(identifier, container);
    this.partialInvalidateDependencyGraph(identifier);
  }

  register(identifier: TypeIdentifier, definition: Definition) {
    if (this.#definitions.get(identifier)) {
      throw Error(
        `Unable to register ${identifier} because it is already registered.`
      );
    }
    this.#definitions.set(identifier, definition);
    this.partialInvalidateDependencyGraph(identifier);
  }

  registerAlias(identifier: TypeIdentifier, alias: TypeIdentifier) {
    this.#aliases.set(alias, identifier);
  }

  registerType(
    identifier: TypeIdentifier,
    type: Type,
    params?: Parameter[],
    props?: Record<string, Parameter>,
    scope?: Scope | string
  ) {
    this.register(identifier, {
      kind: "type",
      type,
      params,
      props,
      scope:
        scope ??
        DiContainer.root().#definitions.get(identifier)?.scope ??
        defaultScope,
    });
  }

  registerFactory(
    identifier: TypeIdentifier,
    factory: FactoryFunction,
    params?: TypeIdentifier[],
    scope: Scope | string = defaultScope
  ) {
    this.register(identifier, {
      kind: "factory",
      factory,
      params,
      scope,
    });
  }

  registerValue(
    identifier: TypeIdentifier,
    value: unknown,
    scope: Scope | string = defaultScope
  ) {
    this.register(identifier, {
      kind: "value",
      value,
      scope,
    });
  }

  registerFromMetadata(
    target: Type,
    paramTypes: Type[],
    identifier?: TypeIdentifier,
    scope?: Scope | string
  ) {
    this.register(identifier ?? target, {
      kind: "type",
      type: target,
      params: paramTypes?.map((param) => ({ identifier: param })),
      scope:
        scope ??
        DiContainer.root().#definitions.get(target)?.scope ??
        defaultScope,
    });
  }

  registerCtorParam(type: Type, paramIndex: number, param: PartialParameter) {
    let ctorOverrides = this.#ctorOverrides.get(type);
    if (!ctorOverrides) {
      ctorOverrides = new Map();
      this.#ctorOverrides.set(type, ctorOverrides);
    }
    let ctorOverride = ctorOverrides.get(paramIndex);
    if (!ctorOverride) {
      ctorOverride = [];
      ctorOverrides.set(paramIndex, ctorOverride);
    }
    ctorOverride.push(param);
    this.partialInvalidateDependencyGraph(type);
  }

  registerProperty(type: Type, propName: string, param: PartialParameter) {
    let props = this.#propOverrides.get(type);
    if (!props) {
      props = new Map();
      this.#propOverrides.set(type, props);
    }
    let prop = props.get(propName);
    if (!prop) {
      prop = [];
      props.set(propName, prop);
    }
    prop.push(param);
    this.partialInvalidateDependencyGraph(type);
  }

  deepClone(cloneMap?: Map<DiContainer, DiContainer>): DiContainer {
    if (!cloneMap) {
      cloneMap = new Map();
    }
    const clone = new DiContainer(
      this.#name,
      this.#parent
        ? cloneMap.has(this.#parent)
          ? (cloneMap.get(this.#parent) as DiContainer)
          : this.#parent?.deepClone(cloneMap)
        : undefined
    );
    cloneMap.set(this, clone);
    clone.#imports = new Map(
      Array.from(this.#imports).map(([identifier, container]) => [
        identifier,
        cloneMap?.has(container)
          ? (cloneMap.get(container) as DiContainer)
          : container.deepClone(cloneMap),
      ])
    );
    clone.#aliases = new Map([...this.#aliases]);
    clone.#definitions = new Map([...this.#definitions]);
    clone.#ctorOverrides = new Map([...this.#ctorOverrides]);
    clone.#propOverrides = new Map([...this.#propOverrides]);
    clone.#dependencyGraph = new Map([...this.#dependencyGraph]);
    return clone;
  }

  private invalidateDependencyGraph() {
    if (this.#dependencyGraph.size > 0) {
      this.#dependencyGraph.clear();
      this.#events.emit("clearGraph");
    }
  }

  private partialInvalidateDependencyGraph(...identifiers: TypeIdentifier[]) {
    for (const graph of Array.from(this.#dependencyGraph.values())) {
      for (const [graphIdentifier, node] of Array.from(graph.entries())) {
        for (const trimIdentifier of identifiers) {
          if (graphIdentifier === trimIdentifier) {
            graph.delete(trimIdentifier);
            this.#events.emit("changeGraph", trimIdentifier);
            continue;
          }
          if (node.kind == "type") {
            for (const param of node.params ?? []) {
              if (param.node.identifier === trimIdentifier) {
                graph.delete(graphIdentifier);
                this.#events.emit("changeGraph", trimIdentifier);
                break;
              }
            }
            for (const [_, prop] of Object.entries(node.props ?? {})) {
              if (prop.node.identifier === trimIdentifier) {
                graph.delete(graphIdentifier);
                this.#events.emit("changeGraph", trimIdentifier);
                break;
              }
            }
          } else if (node.kind == "factory") {
            for (const param of node.params ?? []) {
              if (param.node.identifier === trimIdentifier) {
                graph.delete(graphIdentifier);
                this.#events.emit("changeGraph", trimIdentifier);
                break;
              }
            }
          }
        }
      }
    }
  }

  private buildDependencyGraph(
    identifier: TypeIdentifier,
    dependencyPath: TypeIdentifier[],
    partialNodes: Map<
      DiContainer,
      Map<TypeIdentifier, PartialDependencyGraphNode>
    >
  ): DependencyGraphNode {
    let node = partialNodes.get(this)?.get(identifier);
    if (!node) {
      const exporter = this.getExporter(identifier);
      if (exporter) {
        return exporter.buildDependencyGraph(
          identifier,
          [...dependencyPath],
          partialNodes
        );
      }
      const definition = this.getDefinition(identifier);
      if (!definition) {
        throw new Error(
          this.getInjectionErrorMessage(identifier, dependencyPath)
        );
      }
      switch (definition.kind) {
        case "type":
          node = {
            identifier,
            kind: definition.kind,
            owner: this,
            scope: definition.scope,
          };
          if (partialNodes.has(this)) {
            partialNodes.get(this)?.set(identifier, node);
          } else {
            partialNodes.set(this, new Map([[identifier, node]]));
          }
          node.ctor = definition.type;
          dependencyPath.push(identifier);
          node.params = this.buildCtorSubtree(
            definition,
            [...dependencyPath],
            partialNodes
          );
          node.props = this.buildPropSubtree(
            definition,
            [...dependencyPath],
            partialNodes
          ).reduce(
            (previous, current) => ({
              ...previous,
              [current.prop]: current,
            }),
            {}
          );
          break;
        case "factory":
          node = {
            identifier,
            kind: definition.kind,
            owner: this,
            scope: definition.scope,
          };
          if (partialNodes.has(this)) {
            partialNodes.get(this)?.set(identifier, node);
          } else {
            partialNodes.set(this, new Map([[identifier, node]]));
          }
          node.factory = definition.factory;
          dependencyPath.push(identifier);
          node.params = this.buildFactorySubtree(
            definition,
            [...dependencyPath],
            partialNodes
          );
          break;
        case "value":
          node = {
            identifier,
            kind: definition.kind,
            owner: this,
            scope: definition.scope,
          };
          if (partialNodes.has(this)) {
            partialNodes.get(this)?.set(identifier, node);
          } else {
            partialNodes.set(this, new Map([[identifier, node]]));
          }
          node.value = definition.value;
      }
    }
    return node as DependencyGraphNode;
  }

  private getInjectionErrorMessage(
    identifier: TypeIdentifier,
    dependencyPath: TypeIdentifier[]
  ) {
    const typeName =
      typeof identifier === "string" ? identifier : identifier.name;
    const pathString = dependencyPath
      .map(
        (pathIdentifier) =>
          `${
            typeof pathIdentifier === "string"
              ? pathIdentifier
              : pathIdentifier.name
          } < `
      )
      .join("");
    return `Error composing ${pathString}${typeName}. ${typeName} is not registered`;
  }

  private buildCtorSubtree(
    definition: TypeDefinition,
    path: TypeIdentifier[],
    nodes: Map<DiContainer, Map<TypeIdentifier, PartialDependencyGraphNode>>
  ) {
    const ctorParms = this.getCtorOverrides(definition.type);
    if (!definition.params && !ctorParms.size) {
      return [];
    }
    return Array.from(ctorParms ?? [])
      .reduce((params, [index, param]) => {
        params[index] = { ...params[index], ...param };
        return params;
      }, definition.params ?? [])
      .map((parameter) => {
        if (parameter.isOptional && !this.getDefinition(parameter.identifier)) {
          return {
            node: {
              identifier: parameter.identifier,
              kind: "null",
            } as NullDependencyGraphNode,
            defer: parameter.defer,
          };
        }
        return {
          node: this.buildDependencyGraph(parameter.identifier, path, nodes),
          defer: parameter.defer,
        };
      });
  }

  private buildPropSubtree(
    definition: TypeDefinition,
    path: TypeIdentifier[],
    nodes: Map<DiContainer, Map<TypeIdentifier, PartialDependencyGraphNode>>
  ) {
    const props = this.getPropOverrides(definition.type);
    if (!definition.props && !props.size) {
      return [];
    }
    return Object.entries(
      Array.from(props).reduce((props, [propName, param]) => {
        props[propName] = { ...props[propName], ...param };
        return props;
      }, definition.props ?? {})
    ).map(([name, parameter]) => {
      if (parameter.isOptional && !this.getDefinition(parameter.identifier)) {
        return {
          prop: name,
          node: {
            identifier: parameter.identifier,
            kind: "null",
          },
        };
      }
      return {
        prop: name,
        node: this.buildDependencyGraph(parameter.identifier, path, nodes),
      };
    });
  }

  private buildFactorySubtree(
    defintion: FactoryDefinition,
    path: TypeIdentifier[],
    nodes: Map<DiContainer, Map<TypeIdentifier, PartialDependencyGraphNode>>
  ) {
    if (!defintion.params) {
      return [];
    }
    return defintion.params.map((parameter) => {
      return { node: this.buildDependencyGraph(parameter, path, nodes) };
    });
  }

  private detectCircularDependencies(
    node: NullableDependencyGraphNode,
    ancestors: NullableDependencyGraphNode[] = []
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
      if ((child as TypeDependencyGraphParmeter).defer) {
        continue;
      }
      this.detectCircularDependencies(child.node, [...ancestors]);
    }
  }

  private getDefinition(identifier: TypeIdentifier): Definition | undefined {
    const alias = this.getAlias(identifier);
    if (alias) {
      identifier = alias;
    }
    let definiton = this.#definitions.get(identifier);
    if (!definiton && this.#parent) {
      definiton = this.#parent.getDefinition(identifier);
    }
    return definiton;
  }

  private getAlias(identifier: TypeIdentifier): TypeIdentifier | undefined {
    let alias = this.#aliases.get(identifier);
    if (!alias) {
      alias = this.#parent?.getAlias(identifier);
    }
    return alias;
  }

  private getDefinitionIdentifiers(): TypeIdentifier[] {
    return [
      ...new Set([
        ...this.#definitions.keys(),
        ...(this.#parent?.getDefinitionIdentifiers() ?? []),
      ]),
    ];
  }

  private getExporter(identifier: TypeIdentifier): DiContainer | undefined {
    let exporter = this.#imports.get(identifier);
    if (!exporter) {
      const parentExporter = this.#parent?.getExporter(identifier);
      if (parentExporter != this) {
        exporter = parentExporter;
      }
    }
    return exporter;
  }

  private getCtorOverrides(type: Type): Map<number, PartialParameter> {
    const definition = new Map(this.#parent?.getCtorOverrides(type) || []);
    this.#ctorOverrides.get(type)?.forEach((ctorOverrides, paramIndex) => {
      const merged = ctorOverrides.reduce(
        (ctorOverride, definition) => ({ ...ctorOverride, ...definition }),
        {}
      );
      definition.set(paramIndex, merged);
    });
    return definition;
  }

  private getPropOverrides(type: Type): Map<string, PartialParameter> {
    const definition = new Map(this.#parent?.getPropOverrides(type) || []);
    this.#propOverrides.get(type)?.forEach((propOverrides, paramName) => {
      const merged = propOverrides.reduce(
        (propOverride, definition) => ({ ...propOverride, ...definition }),
        {}
      );
      definition.set(paramName, merged);
    });
    return definition;
  }
}
