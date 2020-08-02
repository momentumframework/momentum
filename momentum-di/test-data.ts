export class Molecule {
  constructor(public atom: Atom) {
  }
}
export class Atom {
  constructor(
    public proton?: Proton,
    public neutron?: Neutron,
    public electron?: Electron,
  ) {
  }
}
export class Proton {
  constructor(public quark: Quark) {
  }
}
export class Neutron {
  constructor(public quark: Quark) {
  }
}
export class Electron {
}
export class Quark {
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
