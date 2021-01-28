import { Inject, Injectable, Optional } from "./mod.ts";

@Injectable()
export class Quark {}

@Injectable()
export class Electron {}

@Injectable()
export class Neutron {
  constructor(public quark: Quark) {}
}

@Injectable()
export class Proton {
  constructor(public quark: Quark) {}
}

@Injectable()
export class Atom {
  constructor(
    public proton?: Proton,
    public neutron?: Neutron,
    public electron?: Electron
  ) {}
}

@Injectable()
export class Molecule {
  constructor(public atom: Atom) {}
}

@Injectable()
export class Person {
  constructor(
    @Inject("PANTS")
    @Optional()
    public pants?: string
  ) {}
}

class Thing {}

@Injectable()
export class ThingOne extends Thing {
  @Inject("THING_TWO")
  otherThing?: Thing;
}

@Injectable("THING_TWO")
export class ThingTwo extends Thing {
  @Inject(ThingOne)
  otherThing?: Thing;
}
