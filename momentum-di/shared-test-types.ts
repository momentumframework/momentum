import { Inject, Injectable, Optional } from "./mod.ts";

@Injectable({ global: true })
export class Quark {}

@Injectable({ global: true })
export class Electron {}

@Injectable({ global: true })
export class Neutron {
  constructor(public quark: Quark) {}
}

@Injectable({ global: true })
export class Proton {
  constructor(public quark: Quark) {}
}

@Injectable({ global: true })
export class Atom {
  constructor(
    public proton?: Proton,
    public neutron?: Neutron,
    public electron?: Electron
  ) {}
}

@Injectable({ global: true })
export class Molecule {
  constructor(public atom: Atom) {}
}

@Injectable({ global: true })
export class Person {
  constructor(
    @Inject("PANTS")
    @Optional()
    public pants?: string
  ) {}
}

class Thing {}

@Injectable({ global: true })
export class ThingOne extends Thing {
  @Inject("THING_TWO")
  otherThing?: Thing;
}

@Injectable("THING_TWO", { global: true })
export class ThingTwo extends Thing {
  @Inject(ThingOne)
  otherThing?: Thing;
}
