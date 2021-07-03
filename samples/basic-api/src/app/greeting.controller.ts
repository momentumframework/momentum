import { Controller, Get, Query } from "../../../../core/mod.ts";
import { GreetingService } from "./greeting.service.ts";

@Controller("greet")
export class GreetingController {
  constructor(private readonly greetingService: GreetingService) {}

  @Get()
  hello(@Query("name") name: string) {
    return this.greetingService.getGreeting(name);
  }
}
