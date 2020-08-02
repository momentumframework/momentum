import { Injectable } from "./decorators/injectable.ts";

@Injectable()
export class Quark {
}

@Injectable()
export class Electron {
}

@Injectable()
export class Neutron {
  constructor(public quark: Quark) {
  }
}

@Injectable()
export class Proton {
  constructor(public quark: Quark) {
  }
}

@Injectable()
export class Atom {
  constructor(
    public proton?: Proton,
    public neutron?: Neutron,
    public electron?: Electron,
  ) {
  }
}

@Injectable()
export class Molecule {
  constructor(public atom: Atom) {
  }
}

export class Money {
  constructor(job: Job) {
  }
}
export class Job {
  constructor(college: College) {
  }
}
export class College {
  constructor(money: Money) {
  }
}

export class ThingOne {
  otherThing?: ThingTwo;
}
export class ThingTwo {
  otherThing?: ThingOne;
}
