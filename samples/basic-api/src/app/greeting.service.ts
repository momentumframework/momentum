import { Injectable } from "../../../../di/mod.ts";

@Injectable()
export class GreetingService {
  getGreeting(name?: string) {
    return `Hello, ${name ?? "World"}!`;
  }
}
