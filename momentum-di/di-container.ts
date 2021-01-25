import { EventEmitter } from "./deps.ts";
import { Reflect } from "./shims/reflect.ts";

export type Token = string;
// deno-lint-ignore no-explicit-any ban-types
export type Type<T = any> = Function & (new (...params: any[]) => T);
// deno-lint-ignore no-explicit-any
export type TypeIdentifier<T = any> = Type<T> | Token;

export type DependencyGraph = Map<TypeIdentifier, DependencyGraphNode>;

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
}
// deno-lint-ignore no-explicit-any
export type FactoryFunction<T = unknown> = (...params: any[]) => T;
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

interface TypeDependencyGraphParmeter {
  node: NullableDependencyGraphNode;
  defer?: boolean;
}

export interface TypeDependencyGraphNode {
  identifier: TypeIdentifier;
  kind: "type";
  ctor: Type;
  params: TypeDependencyGraphParmeter[];
  props: {
    [name: string]: TypeDependencyGraphParmeter;
  };
}
export interface FactoryDependencyGraphNode {
  identifier: TypeIdentifier;
  kind: "factory";
  factory: FactoryFunction;
  params: { node: DependencyGraphNode }[];
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

  readonly #name?: string;
  readonly #parent?: DiContainer;
  readonly #events = new EventEmitter<{ change(): void }>();
  readonly #imports = new Map<TypeIdentifier, DiContainer>();
  readonly #aliases = new Map<TypeIdentifier, TypeIdentifier>();
  readonly #definitions = new Map<TypeIdentifier, Definition>();
  readonly #ctorOverrides = new Map<Type, Map<number, PartialParameter[]>>();
  readonly #propOverrides = new Map<Type, Map<string, PartialParameter[]>>();
  readonly #dependencyGraph = new Map<
    TypeIdentifier,
    NullableDependencyGraphNode
  >();

  constructor(parent?: DiContainer, name?: string) {
    this.#parent = parent;
    this.#name = name;
    if (this.#parent) {
      this.#parent.#events.on("change", () => this.invalidateDependencyGraph());
    }
  }

  get name() {
    return this.#name;
  }

  static root() {
    if (!DiContainer.globalContainer) {
      DiContainer.globalContainer = new DiContainer(undefined, "root");
    }
    return DiContainer.globalContainer;
  }

  createChild(name?: string) {
    return new DiContainer(this, name);
  }

  getDependencyGraph(identifier: TypeIdentifier) {
    const partialNodes = new Map(this.#dependencyGraph);
    const graph = this.buildDependencyGraph(identifier, [], partialNodes);

    this.detectCircularDependencies(graph);

    this.#dependencyGraph.set(identifier, graph);

    return graph;
  }

  preCompileDependencyGraph() {
    this.invalidateDependencyGraph();
    const partialNodes = new Map<TypeIdentifier, PartialDependencyGraphNode>();
    for (const identifier of this.getDefinitionIdentifiers()) {
      this.#dependencyGraph.set(
        identifier,
        this.buildDependencyGraph(identifier, [], partialNodes)
      );
    }
    for (const graph of this.#dependencyGraph.values()) {
      this.detectCircularDependencies(graph);
    }
  }

  isRegistered(identifier: TypeIdentifier) {
    return this.#definitions.has(identifier);
  }

  import(identifier: TypeIdentifier, container: DiContainer) {
    this.#imports.set(identifier, container);
    container.#events.on("change", () => this.invalidateDependencyGraph());
  }

  register(identifier: TypeIdentifier, definition: Definition) {
    if (this.#definitions.get(identifier)) {
      throw Error(
        `Unable to register ${identifier} because it is already registered.`
      );
    }
    this.#definitions.set(identifier, definition);
    this.invalidateDependencyGraph();
  }

  registerAlias(identifier: TypeIdentifier, alias: TypeIdentifier) {
    this.#aliases.set(alias, identifier);
  }

  registerType(
    identifier: TypeIdentifier,
    type: Type,
    params?: Parameter[],
    props?: Record<string, Parameter>
  ) {
    this.register(identifier, {
      kind: "type",
      type,
      params,
      props,
    });
  }

  registerFactory(
    identifier: TypeIdentifier,
    factory: FactoryFunction,
    params?: TypeIdentifier[]
  ) {
    this.register(identifier, {
      kind: "factory",
      factory,
      params,
    });
  }

  registerValue(identifier: TypeIdentifier, value: unknown) {
    this.register(identifier, {
      kind: "value",
      value,
    });
  }

  registerFromMetadata(target: Type, identifier?: TypeIdentifier) {
    const paramTypes: Type[] = Reflect.getMetadata("design:paramtypes", target);
    this.register(identifier ?? target, {
      kind: "type",
      type: target,
      params: paramTypes?.map((param) => ({ identifier: param })),
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
    this.invalidateDependencyGraph();
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
    this.invalidateDependencyGraph();
  }

  private invalidateDependencyGraph() {
    if (this.#dependencyGraph.size > 0) {
      this.#dependencyGraph.clear();
      this.#events.emit("change");
    }
  }

  private buildDependencyGraph(
    identifier: TypeIdentifier,
    path: TypeIdentifier[],
    partialNodes: Map<TypeIdentifier, PartialDependencyGraphNode>
  ): DependencyGraphNode {
    let node = partialNodes.get(identifier);
    if (!node) {
      const exporter = this.getExporter(identifier);
      if (exporter) {
        return exporter.buildDependencyGraph(
          identifier,
          [...path],
          partialNodes
        );
      }
      const definition = this.getDefinition(identifier);
      if (!definition) {
        const typeName =
          typeof identifier === "string" ? identifier : identifier.name;
        const pathString = path
          .map(
            (pathIdentifier) =>
              `${
                typeof pathIdentifier === "string"
                  ? pathIdentifier
                  : pathIdentifier.name
              } < `
          )
          .join("");
        throw Error(
          `Error composing ${pathString}${typeName}. ${typeName} is not registered`
        );
      }
      switch (definition.kind) {
        case "type":
          node = { identifier, kind: definition.kind };
          partialNodes.set(identifier, node);
          node.ctor = definition.type;
          path.push(identifier);
          node.params = this.buildCtorSubtree(
            definition,
            [...path],
            partialNodes
          );
          node.props = this.buildPropSubtree(
            definition,
            [...path],
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
          node = { identifier, kind: definition.kind };
          partialNodes.set(identifier, node);
          node.factory = definition.factory;
          path.push(identifier);
          node.params = this.buildFactorySubtree(
            definition,
            [...path],
            partialNodes
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
    nodes: Map<TypeIdentifier, PartialDependencyGraphNode>
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
    nodes: Map<TypeIdentifier, PartialDependencyGraphNode>
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
    nodes: Map<TypeIdentifier, PartialDependencyGraphNode>
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
