import {
  assert,
  assertEquals,
  assertNotEquals,
  assertThrows,
  test,
} from "./test_deps.ts";

import { DependencyScope } from "./dependency-scope.ts";
import { Person } from "./shared-test-types.ts";

test("DependencyScope.beginScope() - creates a new dependency scope", () => {
  // act
  const scope = DependencyScope.beginScope();

  // assert
  assert(scope instanceof DependencyScope);
});

test("DependencyScope.set() - caches a dependency", () => {
  // arrange
  const scope = DependencyScope.beginScope();
  const obj = new Person();

  // act
  scope.set(Person, obj);

  // assert
  assertEquals(scope.get(Person), obj);
});

test("DependencyScope.get() - gets a cached dependency", () => {
  // arrange
  const scope = DependencyScope.beginScope();
  const obj = new Person();

  scope.set(Person, obj);

  // act
  const cached = scope.get(Person);

  // assert
  assertEquals(cached, obj);
});

test("DependencyScope.endScope() - ends the scope", () => {
  // arrange
  const scope = DependencyScope.beginScope();

  // act
  scope.endScope();

  // assert
  assert(scope.isEnded);
  assertThrows(() => scope.set(String, ""), undefined, "Scope is ended");
  assertThrows(() => scope.get(String), undefined, "Scope is ended");
});
