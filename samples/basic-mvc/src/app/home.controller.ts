import { Controller, Get, Query } from "../../../../core/mod.ts";
import { View } from "../../../../mvc/mod.ts";
import { GreetingService } from "./greeting.service.ts";

@Controller("")
export class HomeController {
  constructor(private readonly greetingService: GreetingService) {}

  @Get()
  @View("index")
  index(@Query("name") name: string) {
    return { greeting: this.greetingService.getGreeting(name) };
  }
}
