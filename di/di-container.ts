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
    invalidateGraph(): void;
    partialInvalidateGraph(type: TypeIdentifier): void;
  }>();
  #imports = new Map<TypeIdentifier, DiContainer>();
  #aliases = new Map<TypeIdentifier, TypeIdentifier>();
  #definitions = new Map<TypeIdentifier, Definition>();
  #ctorOverrides = new Map<Type, Map<number, PartialParameter[]>>();
  #propOverrides = new Map<Type, Map<string, PartialParameter[]>>();
  #dependencyGraph = new Map<TypeIdentifier, NullableDependencyGraphNode>();

  constructor(name: string, parent?: DiContainer) {
    this.#parent = parent;
    this.#name = name;
    if (this.#parent) {
      this.#parent.#events.on(
        "partialInvalidateGraph",
        (identifier) => this.partialInvalidateDependencyGraph(identifier),
      );
      this.#parent.#events.on(
        "invalidateGraph",
        () => this.invalidateDependencyGraph(),
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
    return this.buildDependencyGraph(identifier, [], partialNodes, false);
  }

  preCompileDependencyGraph(ignoreMissing = false) {
    this.invalidateDependencyGraph();
    const partialNodes = new Map<TypeIdentifier, PartialDependencyGraphNode>();
    for (const identifier of this.getDefinitionIdentifiers()) {
      const graph = this.buildDependencyGraph(
        identifier,
        [],
        partialNodes,
        ignoreMissing,
      );
      if (graph) {
        this.#dependencyGraph.set(identifier, graph);
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
        `Unable to register ${identifier} because it is already registered.`,
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
    scope?: Scope | string,
  ) {
    this.register(identifier, {
      kind: "type",
      type,
      params,
      props,
      scope: scope ??
        DiContainer.root().#definitions.get(identifier)?.scope ??
        defaultScope,
    });
  }

  registerFactory(
    identifier: TypeIdentifier,
    factory: FactoryFunction,
    params?: TypeIdentifier[],
    scope: Scope | string = defaultScope,
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
    scope: Scope | string = defaultScope,
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
    scope?: Scope | string,
  ) {
    this.register(identifier ?? target, {
      kind: "type",
      type: target,
      params: paramTypes?.map((param) => ({ identifier: param })),
      scope: scope ??
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

  deepClone(
    cloneMap: Map<DiContainer, DiContainer> = new Map(),
  ): { clone: DiContainer; fullSet: DiContainer[] } {
    const clone = new DiContainer(
      this.#name,
      this.#parent
        ? cloneMap.has(this.#parent)
          ? (cloneMap.get(this.#parent) as DiContainer)
          : this.#parent?.deepClone(cloneMap).clone
        : undefined,
    );
    cloneMap.set(this, clone);
    clone.#imports = new Map(
      Array.from(this.#imports).map(([identifier, container]) => [
        identifier,
        cloneMap?.has(container)
          ? (cloneMap.get(container) as DiContainer)
          : container.deepClone(cloneMap).clone,
      ]),
    );
    clone.#aliases = new Map([...this.#aliases]);
    clone.#definitions = new Map([...this.#definitions]);
    clone.#ctorOverrides = new Map([...this.#ctorOverrides]);
    clone.#propOverrides = new Map([...this.#propOverrides]);
    clone.#dependencyGraph = new Map([...this.#dependencyGraph]);
    return { clone, fullSet: Array.from(cloneMap.values()) };
  }

  private invalidateDependencyGraph() {
    if (this.#dependencyGraph.size > 0) {
      this.#dependencyGraph.clear();
      this.#events.emit("invalidateGraph");
    }
  }

  private partialInvalidateDependencyGraph(...identifiers: TypeIdentifier[]) {
    for (const invalidatedIdentifier of identifiers) {
      const exporter = this.getExporter(invalidatedIdentifier);
      if (exporter) {
        exporter.partialInvalidateDependencyGraph(invalidatedIdentifier);
        continue;
      }
      for (
        const [graphIdentifier, node] of Array.from(
          this.#dependencyGraph.entries(),
        )
      ) {
        if (graphIdentifier === invalidatedIdentifier) {
          this.#dependencyGraph.delete(invalidatedIdentifier);
          this.#events.emit("partialInvalidateGraph", invalidatedIdentifier);
          continue;
        }
        if (node.kind == "type") {
          for (const param of node.params ?? []) {
            if (param.node.identifier === invalidatedIdentifier) {
              this.#dependencyGraph.delete(graphIdentifier);
              this.#events.emit(
                "partialInvalidateGraph",
                invalidatedIdentifier,
              );
              break;
            }
          }
          for (const [_, prop] of Object.entries(node.props ?? {})) {
            if (prop.node.identifier === invalidatedIdentifier) {
              this.#dependencyGraph.delete(graphIdentifier);
              this.#events.emit(
                "partialInvalidateGraph",
                invalidatedIdentifier,
              );
              break;
            }
          }
        } else if (node.kind == "factory") {
          for (const param of node.params ?? []) {
            if (param.node.identifier === invalidatedIdentifier) {
              this.#dependencyGraph.delete(graphIdentifier);
              this.#events.emit(
                "partialInvalidateGraph",
                invalidatedIdentifier,
              );
              break;
            }
          }
        }
      }
    }
  }

  private buildDependencyGraph(
    identifier: TypeIdentifier,
    dependencyPath: TypeIdentifier[],
    partialNodes: Map<TypeIdentifier, PartialDependencyGraphNode>,
    ignoreMissing: boolean,
  ): DependencyGraphNode | undefined {
    let node = partialNodes.get(identifier);
    if (node) {
      return node as DependencyGraphNode;
    }
    const exporter = this.getExporter(identifier);
    if (exporter) {
      return exporter.buildDependencyGraph(
        identifier,
        [...dependencyPath],
        new Map(exporter.#dependencyGraph),
        ignoreMissing,
      );
    }
    const definition = this.getDefinition(identifier);
    if (!definition) {
      if (ignoreMissing) {
        return;
      }
      throw new Error(
        this.getInjectionErrorMessage(identifier, dependencyPath),
      );
    }
    switch (definition.kind) {
      case "type":
        node = this.buildTypeNode(
          identifier,
          definition,
          partialNodes,
          dependencyPath,
          ignoreMissing,
        );
        break;
      case "factory":
        node = this.buildFactoryNode(
          identifier,
          definition,
          partialNodes,
          dependencyPath,
          ignoreMissing,
        );
        break;
      case "value":
        node = {
          identifier,
          kind: definition.kind,
          owner: this,
          scope: definition.scope,
        };
        partialNodes.set(identifier, node);
        node.value = definition.value;
    }
    if (!node) {
      return;
    }
    const fullNode = node as DependencyGraphNode;
    this.detectCircularDependencies(fullNode);
    this.#dependencyGraph.set(identifier, fullNode);
    return fullNode;
  }
  buildFactoryNode(
    identifier: TypeIdentifier,
    definition: FactoryDefinition,
    partialNodes: Map<TypeIdentifier, PartialDependencyGraphNode>,
    dependencyPath: TypeIdentifier[],
    ignoreMissing: boolean,
  ) {
    const node: PartialDependencyGraphNode = {
      identifier,
      kind: "factory",
      owner: this,
      scope: definition.scope,
    };
    partialNodes.set(identifier, node);
    node.factory = definition.factory;
    dependencyPath.push(identifier);
    const params = this.buildFactorySubtree(
      definition,
      [...dependencyPath],
      partialNodes,
      ignoreMissing,
    );
    if (!params) {
      partialNodes.delete(identifier);
      return;
    }
    node.params = params;
    return node;
  }

  private buildTypeNode(
    identifier: TypeIdentifier,
    definition: TypeDefinition,
    partialNodes: Map<TypeIdentifier, PartialDependencyGraphNode>,
    dependencyPath: TypeIdentifier[],
    ignoreMissing: boolean,
  ) {
    const node: PartialDependencyGraphNode = {
      identifier,
      kind: "type",
      owner: this,
      scope: definition.scope,
    };
    partialNodes.set(identifier, node);
    node.ctor = definition.type;
    dependencyPath.push(identifier);
    const params = this.buildCtorSubtree(
      definition,
      [...dependencyPath],
      partialNodes,
      ignoreMissing,
    );
    if (!params) {
      partialNodes.delete(identifier);
      return;
    }
    node.params = params as TypeDependencyGraphParmeter[];
    const props = this.buildPropSubtree(
      definition,
      [...dependencyPath],
      partialNodes,
      ignoreMissing,
    );
    if (!props) {
      partialNodes.delete(identifier);
      return;
    }
    node.props = props.reduce(
      (previous, current) => ({
        ...previous,
        [current.prop]: current,
      }),
      {},
    );
    return node;
  }

  private getInjectionErrorMessage(
    identifier: TypeIdentifier,
    dependencyPath: TypeIdentifier[],
  ) {
    const typeName = typeof identifier === "string"
      ? identifier
      : identifier.name;
    const pathString = dependencyPath
      .map(
        (pathIdentifier) =>
          `${
            typeof pathIdentifier === "string"
              ? pathIdentifier
              : pathIdentifier.name
          } < `,
      )
      .join("");
    return `Error composing ${pathString}${typeName}. ${typeName} is not registered`;
  }

  private buildCtorSubtree(
    definition: TypeDefinition,
    path: TypeIdentifier[],
    nodes: Map<TypeIdentifier, PartialDependencyGraphNode>,
    ignoreMissing: boolean,
  ) {
    const ctorParams = this.getCtorOverrides(definition.type);
    if (!definition.params && !ctorParams.size) {
      return [];
    }
    const mergedCtorParams = Array.from(ctorParams ?? []).reduce(
      (params, [index, param]) => {
        params[index] = { ...params[index], ...param };
        return params;
      },
      definition.params ?? [],
    );
    const parameters = [];
    for (let i = 0; i < mergedCtorParams.length; i++) {
      if (
        mergedCtorParams[i].isOptional &&
        !this.getDefinition(mergedCtorParams[i].identifier)
      ) {
        parameters[i] = {
          node: {
            identifier: mergedCtorParams[i].identifier,
            kind: "null",
          } as NullDependencyGraphNode,
          defer: mergedCtorParams[i].defer,
        };
        continue;
      }
      const node = this.buildDependencyGraph(
        mergedCtorParams[i].identifier,
        path,
        nodes,
        ignoreMissing,
      );
      if (!node) {
        return;
      }
      parameters[i] = {
        node,
        defer: mergedCtorParams[i].defer,
      };
    }
    return parameters;
  }

  private buildPropSubtree(
    definition: TypeDefinition,
    path: TypeIdentifier[],
    nodes: Map<TypeIdentifier, PartialDependencyGraphNode>,
    ignoreMissing: boolean,
  ) {
    const props = this.getPropOverrides(definition.type);
    if (!definition.props && !props.size) {
      return [];
    }
    return Object.entries(
      Array.from(props).reduce((props, [propName, param]) => {
        props[propName] = { ...props[propName], ...param };
        return props;
      }, definition.props ?? {}),
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
        node: this.buildDependencyGraph(
          parameter.identifier,
          path,
          nodes,
          ignoreMissing,
        ),
      };
    });
  }

  private buildFactorySubtree(
    defintion: FactoryDefinition,
    path: TypeIdentifier[],
    nodes: Map<TypeIdentifier, PartialDependencyGraphNode>,
    ignoreMissing: boolean,
  ) {
    if (!defintion.params) {
      return [];
    }
    const paramNodes: { node: DependencyGraphNode }[] = [];
    for (const paramDefinition of defintion.params) {
      const node = this.buildDependencyGraph(
        paramDefinition,
        path,
        nodes,
        ignoreMissing,
      );
      if (!node) {
        return;
      }
      paramNodes.push({ node });
    }
    return paramNodes;
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
        {},
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
        {},
      );
      definition.set(paramName, merged);
    });
    return definition;
  }
}
